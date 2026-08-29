#!/usr/bin/env bash
# =============================================================================
# Emit the Apache mod_remoteip configuration from deploy/cloudflare-ips.txt.
#
#     bash deploy/generate-remoteip-conf.sh > deploy/lightsail-remoteip.conf
#
# The trusted-proxy list and the ufw allowlist are the same set of ranges. They
# are generated from one file so they cannot drift apart: a range that ufw admits
# but Apache does not trust still reaches the origin, and its CF-Connecting-IP is
# then silently ignored, so those requests go on logging the Cloudflare edge IP
# with nothing to indicate anything is wrong.
#
# Output is deterministic (no timestamps) so CI can diff it against the checked-in
# file -- see .github/workflows/cloudflare-ip-monitor.yml.
# =============================================================================
set -euo pipefail

src="$(dirname "$0")/cloudflare-ips.txt"
[ -r "$src" ] || { echo "!! cannot read $src" >&2; exit 1; }

ranges="$(sed '/^[[:space:]]*#/d; /^[[:space:]]*$/d' "$src" | tr -d '\r' | sort -u)"
[ -n "$ranges" ] || { echo "!! no ranges found in $src" >&2; exit 1; }

cat <<'HEADER'
# Restore the real visitor IP behind Cloudflare.
#
# GENERATED FILE -- do not hand-edit.
#   bash deploy/generate-remoteip-conf.sh > deploy/lightsail-remoteip.conf
# The ranges come from deploy/cloudflare-ips.txt, the same source as the ufw
# allowlist, so the two cannot diverge.
#
# Why this is needed: :80 and :443 on the origin are firewalled to Cloudflare's
# ranges, so every connection arrives from a Cloudflare edge address and every
# access-log line recorded Cloudflare rather than the visitor. Log-driven
# analysis was blind, and a fail2ban jail built on these logs would have banned
# Cloudflare rather than an attacker.
#
# Apache 2.4's %h and %a already report the useragent address that mod_remoteip
# rewrites, so the existing "combined" LogFormat needs no change and downstream
# log parsers keep working. %{c}a still gives the real peer when debugging.
#
# RemoteIPTrustedProxy means the header is honoured ONLY when the connection
# itself comes from one of these ranges. The firewall already guarantees that;
# this is the second layer, so a direct connection cannot spoof its own address.
#
# Install on the origin as:
#   /etc/apache2/conf-available/remoteip.conf   (then: a2enconf remoteip)

<IfModule remoteip_module>
    # Cloudflare sends exactly one address here, unlike X-Forwarded-For, which
    # arrives as a client-appendable list.
    RemoteIPHeader CF-Connecting-IP

HEADER

while IFS= read -r cidr; do
    printf '    RemoteIPTrustedProxy %s\n' "$cidr"
done <<< "$ranges"

cat <<'FOOTER'
</IfModule>
FOOTER
