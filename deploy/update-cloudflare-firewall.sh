#!/usr/bin/env bash
# =============================================================================
# Re-sync the ufw Cloudflare allowlist on the ComputerJy origin.
#
# Run ON the origin, as root:
#     sudo bash deploy/update-cloudflare-firewall.sh
#
# Safety properties:
#   * Aborts without touching the firewall if the fetched list looks implausible.
#   * Arms a dead-man switch that disables ufw after ROLLBACK_SECONDS. It NEVER
#     cancels that switch for you -- verify the site first, then cancel manually.
#   * Adds new ranges BEFORE pruning stale ones, so there is no window in which
#     Cloudflare is locked out of the origin.
#   * Never touches the :22 rule.
# =============================================================================
set -euo pipefail

ROLLBACK_SECONDS="${ROLLBACK_SECONDS:-600}"

if [ "$(id -u)" -ne 0 ]; then
    echo "!! must run as root (use sudo)" >&2
    exit 1
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo ">> fetching Cloudflare published ranges"
curl -fsS --retry 3 --retry-delay 5 https://www.cloudflare.com/ips-v4 -o "$tmp/v4"
curl -fsS --retry 3 --retry-delay 5 https://www.cloudflare.com/ips-v6 -o "$tmp/v6"
awk 1 "$tmp/v4" "$tmp/v6" | tr -d '\r' | sed '/^[[:space:]]*$/d' | sort -u > "$tmp/ranges"

v4=$(grep -c '^[0-9]' "$tmp/ranges" || true)
v6=$(grep -c ':'      "$tmp/ranges" || true)
if [ "$v4" -lt 10 ] || [ "$v6" -lt 5 ]; then
    echo "!! fetched list looks wrong (v4=$v4 v6=$v6) -- aborting, firewall untouched" >&2
    exit 1
fi
if grep -qvE '^[0-9a-fA-F:.]+/[0-9]{1,3}$' "$tmp/ranges"; then
    echo "!! non-CIDR content in fetched list -- aborting, firewall untouched" >&2
    exit 1
fi
echo "   $v4 IPv4 + $v6 IPv6 ranges"

echo ">> arming dead-man switch (${ROLLBACK_SECONDS}s)"
systemctl stop ufw-rollback.timer 2>/dev/null || true
systemctl reset-failed ufw-rollback.timer ufw-rollback.service 2>/dev/null || true
systemd-run --on-active="$ROLLBACK_SECONDS" --unit=ufw-rollback /usr/sbin/ufw --force disable >/dev/null
echo "   ufw will auto-disable in ${ROLLBACK_SECONDS}s unless you cancel it"

echo ">> adding current ranges (before pruning, so CF is never locked out)"
while read -r c; do
    [ -n "$c" ] || continue
    ufw allow proto tcp from "$c" to any port 80  comment 'cloudflare' >/dev/null
    ufw allow proto tcp from "$c" to any port 443 comment 'cloudflare' >/dev/null
done < "$tmp/ranges"

echo ">> pruning stale ranges"
ufw status | grep '# cloudflare' | awk '{print $3}' | sort -u > "$tmp/current"
comm -23 "$tmp/current" "$tmp/ranges" > "$tmp/stale"
if [ -s "$tmp/stale" ]; then
    while read -r c; do
        [ -n "$c" ] || continue
        echo "   removing $c"
        ufw --force delete allow proto tcp from "$c" to any port 80  >/dev/null 2>&1 || true
        ufw --force delete allow proto tcp from "$c" to any port 443 >/dev/null 2>&1 || true
    done < "$tmp/stale"
else
    echo "   none"
fi

ufw --force enable >/dev/null
echo ">> done. cloudflare rules: $(ufw status | grep -c '# cloudflare')"
echo ""
echo "NEXT -- verify from another machine, then cancel the rollback:"
echo "  curl -sS -o /dev/null -w '%{http_code}\\n' https://www.computerjy.com/"
echo "  sudo systemctl stop ufw-rollback.timer"
echo ""
echo "Then update deploy/cloudflare-ips.txt to match:"
echo "  sudo ufw status | grep '# cloudflare' | awk '{print \$3}' | sort -u"
