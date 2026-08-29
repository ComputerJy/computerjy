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
| Client IP filtering | the origin's public IP only |
| TTL | none (long-lived) |

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
