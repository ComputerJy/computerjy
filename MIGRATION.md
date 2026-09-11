# Migrating computerjy.com back to WordPress rendering

Today the public site is a **static Astro build in R2, served by the Cloudflare
Worker** in `workers/edge-router/`; Apache and WordPress only handle
`/wp-admin`, `/wp-json`, `*.php` and `Accept: text/markdown` pass-throughs.
Switching the front end back to WordPress means WordPress starts answering `/`
and every post URL. This file lists what has to move with it.

Work through it in order. Steps 1–4 are parity work you can do before any
cutover; step 5 is the switch; step 6 is what to retire afterwards.

---

## 1. URL parity — the highest-risk item

Astro builds with `trailingSlash: 'never'` and `format: 'directory'`, and posts
live under `/posts/<slug>`. Confirm the exact live shapes before changing
anything:

```bash
curl -sI https://www.computerjy.com/posts/<known-slug> | head -1
sudo -u www-data wp option get permalink_structure --path=/var/www/wordpress
```

Then either set the WordPress permalink structure to match the Astro URLs, or
add 301s from the old shapes to the new ones. Matching is strongly preferred —
the site is 18 years old and its inbound links and search rankings are the
asset here. `scripts/known-slugs.json` in the repo is the list to verify
against; check every slug resolves 200 after the switch, not a sample.

Category and tag archives, pagination (`/page/2`), and the author pages all
need the same check.

## 2. Endpoints Astro generated that WordPress does not

| Astro                               | WordPress equivalent | Action                                                                                                                                                                        |
| ----------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/rss.xml` (`src/pages/rss.xml.ts`) | `/feed/`             | 301 `/rss.xml` → `/feed/`, or a rewrite so the old URL keeps working. Feed readers will not re-subscribe.                                                                     |
| `/search-index.json`                | none                 | The ⌘K modal in this theme submits to `?s=` instead. If you want instant client-side search back, keep generating an index (a small plugin or a transient-backed REST route). |
| `/404`                              | `404.php`            | Included in this theme.                                                                                                                                                       |

The theme's search overlay currently lists recent posts and hands the query to
WordPress search. That is a real downgrade from the prebuilt index — decide
whether that matters before cutover.

## 3. Agent-discovery and static artifacts

`public/.well-known/*`, `public/api/openapi.json`, `public/agent-card.json`,
`public/ai-catalog.json`, `public/robots.txt`, `public/security.txt` and
`public/markdown.php` were served from the static build. They must keep
working at the same paths with the same content types and `Link` headers —
`deploy/lightsail-apache.conf` already encodes those rules, and
`.agents/rules/ai-agent-discovery.md` is the spec.

Simplest path: leave those files on disk in the Apache DocumentRoot and let the
vhost serve them ahead of the WordPress rewrite, exactly as it does now.

## 4. Performance

The static site was the performance story. WordPress rendering every request
changes the shape of the problem:

- W3TC is already installed on the origin. Turn on page caching and make sure
  Cloudflare still caches HTML (the current `s-maxage=3600` is what makes the
  edge fast).
- This theme adds no build step and enqueues two small files, but it does load
  three Google Font families. Self-host them if you want to drop the third-party
  round trip.
- Featured images: the theme registers four sizes. Run a thumbnail regeneration
  after activation or cards will fall back to full-size uploads.

## 5. The cutover

1. Deploy and activate the theme (see `CLAUDE.md`), and confirm it renders
   correctly through the WordPress pass-through — `*.php` already reaches
   Apache, so you can check before touching any route.
2. Point Apache's DocumentRoot at `/var/www/wordpress` (it is currently the
   static build), keeping the explicit routes for `/wp-cron.php`, the Jetpack
   `?for=jetpack` channel, and the `.well-known` paths.
3. Remove or narrow the Cloudflare Worker routes for `www.computerjy.com/*` and
   `computerjy.com/*`. Per `deploy/cloudflare-r2.md`, deleting the routes is a
   complete rollback path — keep R2 and the build around until you are confident.
4. Purge the Cloudflare cache. HTML is served with `s-maxage=3600`, so stale
   static pages will otherwise persist for an hour.
5. Re-check the slug list, the feed, and a few category/tag/author URLs.

## 6. What to retire afterwards

Already removed from the repo (2026-09-12, ahead of the cutover): the Astro
source (`src/`, `astro.config.mjs`, `tailwind.config.mjs`), its build/verify
pipeline (`scripts/verify-build.mjs`, `deploy/deploy-lightsail.sh`,
`.github/workflows/deploy.yml`), and the two plugins that only served the
static build — `computerjy-rebuild-webhook` and `computerjy-rest-comments`.
Everything is recoverable from git history (last commit carrying them:
`64a56af`).

Still installed on the origin and to be dealt with at cutover:

- **Deactivate** `computerjy-rebuild-webhook` (it dispatches to a workflow that
  no longer exists) and `computerjy-rest-comments` (the theme's native comment
  form POSTs to `wp-comments-post.php`; leave it only if something else posts
  comments over REST).
- `workers/edge-router/` and `deploy/cloudflare-r2.md` stay in the repo until
  the Worker routes are detached (step 5.3). The R2 bucket holds the last
  static build as a frozen snapshot, so re-attaching the routes is still a
  rollback — but it can no longer be rebuilt. Delete the Worker directory, its
  two tests and the R2 doc once the cutover has held for a week.

## 7. Analytics

The old theme hardcoded GA4 `G-MYP6LK1T99` in `header.php`; the Astro layout
loads it too. This theme reads it from **Customize → ComputerJy: Brand & Social
→ Google Analytics 4 measurement ID** and skips it for logged-in users. Set it
before cutover or you will lose continuity in reporting.
