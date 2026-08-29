# Origin TLS: certbot via DNS-01

The origin's certificate is issued by Let's Encrypt and renewed unattended by the
certbot snap's systemd timer (`snap.certbot.renew.timer`, every 2h). Validation uses
**DNS-01** against Cloudflare, not HTTP-01.

## Why DNS-01

Ports 80 and 443 on the origin are firewalled to Cloudflare's published IP ranges
(`deploy/cloudflare-ips.txt`). Under the previous `authenticator = apache` setting,
Let's Encrypt reached the origin over port 80 *through* Cloudflare, so renewal only
worked while the domain stayed proxied. Grey-clouding the domain, pausing Cloudflare,
or an edge incident during a renewal window would have broken renewal — silently, as
described below.

DNS-01 answers the challenge by writing a `_acme-challenge` TXT record through the
Cloudflare API. It never touches the origin's inbound ports, so renewal no longer
depends on the proxy being in front of the site.

## The API token

Certbot reads a Cloudflare token from `/root/.secrets/cloudflare.ini` (mode `0600`,
owned by root). The token is scoped as narrowly as Cloudflare allows:

| Setting | Value |
|---|---|
| Permission | `Zone` → `DNS` → `Edit` |
| Zone resources | Include → Specific zone → `computerjy.com` |
| Client IP filtering | the origin's public IPv4 **and** IPv6 addresses |
| TTL | none (long-lived) |

### Both address families are required

The origin has IPv6 connectivity and `getaddrinfo` prefers it, so requests to the
Cloudflare API leave over IPv6. A token pinned to the IPv4 address alone is rejected
with `code 9109 — Cannot use the access token from location: <IPv6>`, which reads like
a bad token but is purely the location check.

Confirm both addresses as the API actually sees them before editing the filter:

```bash
curl -4 -s https://api.cloudflare.com/cdn-cgi/trace | sed -n 's/^ip=//p'
curl -6 -s https://api.cloudflare.com/cdn-cgi/trace | sed -n 's/^ip=//p'
```

The IPv6 address is DHCPv6-assigned to the instance's ENI (`use_tempaddr=0`, so it is
not a rotating privacy address); its short lease lifetime is AWS's renewal cadence, not
address rotation. If AWS ever does reassign it, renewal starts failing — the expiry
monitor is what turns that into an alert instead of an outage.

**This token is the main cost of DNS-01.** It can edit DNS for the zone, so a
compromise of the origin becomes a compromise of the domain. The zone scope and the
client-IP restriction are what contain that; keep both when rotating.

To rotate: create the replacement in the Cloudflare dashboard, write it to
`/root/.secrets/cloudflare.ini`, run `sudo certbot renew --dry-run` to confirm the new
token works, then revoke the old one.

## Certificate contents

The certificate covers **both** `computerjy.com` and `www.computerjy.com`.

Both names are load-bearing. Cloudflare connects to the origin using the requested
hostname, which is `www.computerjy.com`; the sole `:443` vhost
(`computerjy-headless.conf`) serves this one certificate. A certificate missing `www`
is rejected by Cloudflare's **Full (Strict)** SSL mode with a 526.

`--cert-name computerjy.com` is pinned so the lineage keeps its existing paths under
`/etc/letsencrypt/live/computerjy.com/`, which the vhost references directly. Reissuing
without it would create a new `-0001` lineage and leave the vhost on the old files.

## Two settings that are load-bearing

Both are recorded in `/etc/letsencrypt/renewal/computerjy.com.conf`. Neither is a
default, and losing either breaks renewal in a way that still looks healthy.

### `dns_cloudflare_propagation_seconds = 90`

Certbot's default wait is 10 seconds. Measured against Cloudflare's authoritative
nameservers during the migration, the two challenge records do not appear together:

| record | visible at |
|---|---|
| `_acme-challenge.computerjy.com` | ~10s |
| `_acme-challenge.www.computerjy.com` | ~35s |

At the default, validation is requested while the `www` record still does not exist,
and renewal fails with `No TXT record found at _acme-challenge.www.computerjy.com`.
The apex passes, so the failure looks like a problem specific to `www` rather than a
timing problem. 90s leaves roughly 2.5x margin over the observed worst case.

### `renew_hook = systemctl reload apache2`

Under the old `authenticator = apache`, certbot's Apache *installer* reloaded the
service after renewal. `certonly` has no installer, so nothing reloads Apache and it
goes on serving the previous certificate from memory until something restarts it.

This failure is invisible to `certbot certificates`, which reads the files on disk.
Verify what is actually on the wire instead:

```bash
echo | openssl s_client -connect 127.0.0.1:443 -servername www.computerjy.com 2>/dev/null \
  | openssl x509 -noout -serial -dates
```

The serial must match `/etc/letsencrypt/live/computerjy.com/cert.pem`.

## Why the monitor exists

Nothing on this host reports a failed renewal:

- there is no MTA, so certbot's local failure mail goes nowhere
- the ACME account has no registered contact address
- Let's Encrypt discontinued expiry notification emails in June 2025

A renewal that starts failing is therefore invisible until the certificate lapses.
`.github/workflows/cert-expiry-monitor.yml` runs daily, reads the certificate over SSH,
and fails the workflow if it expires within 21 days or has lost a required name.
Certbot renews at 30 days remaining, so a healthy certificate never trips it.

The monitor also treats *its own* failure to read the certificate as an alert. A
monitor that silently stops checking is worse than no monitor, because it looks green.

## Verifying

```bash
sudo certbot certificates              # names, expiry, paths
sudo certbot renew --dry-run           # full DNS-01 round trip against staging
```

The dry run takes ~1-2 minutes: certbot writes the TXT record, waits out the
propagation delay, then cleans up.
