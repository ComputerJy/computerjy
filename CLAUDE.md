# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Tracked despite `~/.gitignore_global` listing `CLAUDE.md`; re-adding it after a delete needs `git add -f`.

## What this repo is

Two independent frontends for the same site (https://www.computerjy.com), living in one repo:

1. **Astro 5 static site** (`src/`, `public/`, `astro.config.mjs`) — the production frontend. Builds to `dist/`, deployed to an AWS Lightsail webroot (`/var/www/computerjy_dist`).
2. **Classic WordPress PHP theme** (repo root: `functions.php`, `header.php`, `single.php`, `template-parts/`, `assets/`, `inc/`) — the theme installed on the WordPress backend that still serves `/wp-admin`, `/wp-json`, and `/wp-content/uploads`.

They share brand tokens and visual language but no code. A change to one does **not** propagate to the other; decide which surface the task targets before editing.

`preview.html` / `preview-single.html` are standalone design mockups — not wired into either build.

## Commands

```bash
npm run dev        # Astro dev server
npm run build      # static build -> dist/
npm run preview    # serve the built dist/

./deploy/deploy-lightsail.sh   # build + rsync dist/ to Lightsail (reads .env)
```

CI (`.github/workflows/security-scan.yml`) plus CodeQL run on every push/PR to `main`. Reproduce locally:

```bash
npm run lint          # format:check (prettier) + lint:php (php -l, maxdepth 3)
npm test              # vitest
npx astro check       # runs the content loaders — needs the live WordPress API
npm run build && npm run verify:build
npm audit --audit-level=high
phpcs --standard=phpcs.xml
```

`prettier --check .` covers **`.md`** — run `npx prettier --write` on any new doc or CI fails.
`phpcs`, `composer` and `actionlint` are **not installed**: fetch `phpcs.phar` from PHPCSStandards releases plus
WPCS + PHPCSUtils + PHPCSExtra tarballs, then `phpcs.phar --config-set installed_paths <wpcs>,<utils>,<extra>`.

Deploy (`.github/workflows/deploy.yml`) runs on `workflow_dispatch` and on a `repository_dispatch` of type
`wp-content-updated` sent by the WordPress plugin; pushing to `main` does not deploy. A `deploy-production`
concurrency group debounces bursts of content dispatches — see `deploy/wordpress-rebuild-trigger.md`.
`repository_dispatch` only triggers workflows on the **default branch**, so trigger changes cannot be tested
from a PR branch.

## Astro data flow — important

Content is fetched from `https://www.computerjy.com/wp-json/wp/v2` **at build time** by the Astro content loaders in `src/lib/wp-loader.ts` (via `src/lib/wp-client.ts`); `src/lib/api.ts` only reads those collections. There is no bundled dataset — `src/data/`, `public/data/` and `scripts/parse_wp_export.py` were removed by the API migration.

Consequences:

- A build only works while the API is reachable. `fetchAllPaginated` hard-fails on a partial or empty response rather than shipping stale content, and `npm run verify:build` gates the deploy.
- The loader fetches posts, categories, tags, comments and featured media only. Comments ship inside each post object (`post.comments`), consumed by `Comments.astro`.
- WordPress _pages_ are not fetched — `contact-me` and `privacy-policy` are hand-authored Astro files.
- Every page uses `getStaticPaths` over the full post list; `output: 'static'`, `trailingSlash: 'never'`, `format: 'directory'`.
- `src/pages/rss.xml.ts` and `src/pages/search-index.json.ts` are build-time endpoints emitting `/rss.xml` and `/search-index.json` (the latter powers the ⌘K `SearchModal`).
- Feed pagination convention: posts 0–3 are the bento hero/side slots, posts 4+ paginate at 12/page (`index.astro`, `page/[page].astro`). Changing the page size means changing both.

## Origin server & Cloudflare edge

- WordPress is at `/var/www/wordpress`; wp-cli is installed — `sudo -u www-data wp <cmd> --path=/var/www/wordpress`.
- WP-Cron is driven by **system cron**: `/etc/cron.d/computerjy-wp-cron` runs `wp cron event run --due-now` every
  5 minutes as `www-data`, logging to `/var/log/wp-cron.log` (rotated weekly). That is the authoritative driver —
  the static site sends WordPress almost no front-end traffic, so page-load spawning alone leaves events unfired.
  `DISABLE_WP_CRON` is deliberately **not** set and `/wp-cron.php` is aliased into `/var/www/wordpress`, so
  `wp cron test`, Site Health's loopback check and W3TC's spawn probe all pass; setting the constant makes W3TC
  report cron broken regardless of reality, since `Util_Environment::is_wpcron_working()` returns false on the
  constant alone. Events run within 5 minutes, never instantly — don't build on `wp_schedule_single_event` for
  anything latency-sensitive.
- **WordPress entry points at the site root must be routed explicitly, or they silently return the homepage.**
  DocumentRoot is the static build, so an unaliased root path resolves against `dist/` and answers 200 with HTML
  instead of erroring — which makes these failures look like plugin bugs. Two are routed in the vhost ahead of
  every static rule: `/wp-cron.php` (cron spawn + Site Health loopback) and `?for=jetpack` / `?_for=jetpack`
  (Jetpack's server-to-server channel — WordPress.com POSTs `/?for=jetpack&jetpack=comms` to the **root**, and
  receiving the 95 KB homepage is what it reports as "site is not connected"). Both are mirrored in `router.ts`
  and asserted by `tests/edge-router.test.ts`. Anything WordPress.com or a plugin calls at `/` needs a route.
- The rebuild plugin is installed by hand — the deploy only rsyncs the static webroot, so edits to
  `inc/computerjy-rebuild-webhook.php` must be copied to the origin separately.
- `grep -r` skips symlinks; use `grep -R` under `/etc/apache2/sites-enabled/`.
- The zone is on Cloudflare **Full (Strict)**, so the origin certificate must cover every proxied hostname.
  Don't infer the SSL mode from external probes: Cloudflare flattens proxied CNAMEs to A records, so `dig` cannot
  distinguish a CNAME (validated against its target) from an A record, and a 200 proves nothing either way.
- **The public site is served by a Cloudflare Worker, not Apache.** `workers/edge-router/` holds
  `www.computerjy.com/*` and `computerjy.com/*`, serving `dist/` out of the R2 bucket `computerjy-bucket` and
  passing WordPress, `*.php` and `Accept: text/markdown` through to Lightsail. Apache still serves those
  pass-throughs and still receives the full build over rsync on every deploy, so deleting the Worker routes is a
  complete rollback. `src/router.ts` is a port of `deploy/lightsail-apache.conf` — **change them together**;
  `tests/edge-router.test.ts` reads the vhost at test time and fails if the `Link` or security headers drift
  apart. Editing the vhost alone no longer changes what visitors get. Deploys mirror to R2 then purge the edge,
  and a failed purge fails the deploy, because HTML is served with `s-maxage=3600`. Rollback, token scopes and the
  parity matrix are in `deploy/cloudflare-r2.md`.
- Cloudflare overrides `Referrer-Policy` to `same-origin` zone-wide, so neither the vhost's nor the Worker's
  `strict-origin-when-cross-origin` reaches clients. Don't "fix" it in either config — it is a dashboard setting.

## Repo-local rules (`.agents/rules/*.md`, always-on)

Two rule files carry hard constraints that CI and CodeQL enforce. Read them before touching the relevant area.

**Tailwind v4 / Astro 5** (`headless-astro-wordpress.md`): integrate Tailwind via `@tailwindcss/vite` only — never `@astrojs/tailwind` (v3-era, breaks with Vite 6). Dark theme is the default: dark custom properties live directly in `:root` in `src/styles/global.css`, `<html>` carries `class="dark" data-theme="dark"` statically, and any theme sync must be registered on **both** `astro:after-swap` and `astro:page-load` or `<ClientRouter />` navigation flashes white.

**Sanitization** (same file): use the escape-first whitelist pattern in `src/lib/utils.ts` (`sanitizeCommentHtml` — escape everything, then restore only attribute-free tags). Regex blacklists and iterative replacement loops trip CodeQL `js/incomplete-sanitization`; a previous fix commit exists specifically for this.

**Secrets**: no server IPs, SSH users, or key paths in tracked files. `deploy/deploy-lightsail.sh` sources `.env` (gitignored, see `.env.example`); workflows use `secrets.LIGHTSAIL_*` and declare `permissions: contents: read`.

## Agent-native discovery layer

The site deliberately implements RFC 9727 / 8288 / 8414 / 9728, MCP, A2A, Agent Skills, and WebMCP. Artifacts live in `public/.well-known/` (`api-catalog`, `agent-card.json`, `ai-catalog.json`, `mcp/server-card.json`, `agent-skills/index.json`, `oauth-*`, `auth.md`) plus `public/api/openapi.json` and `public/markdown.php`. `.agents/rules/ai-agent-discovery.md` specifies the exact content types, headers, and JSON shapes — follow it rather than improvising.

Serving these correctly depends on the **web server config**, which is checked in but applied by hand on the server: `deploy/lightsail-apache.conf` — production, and the only web server config in the repo, kept byte-identical to the live vhost. It sets the `Link` header, the `Accept: text/markdown` → `markdown.php` rewrite guarded by an on-disk `-f` check, and per-path content types. Editing the well-known files usually implies a matching config change.

`src/layouts/BaseLayout.astro` registers WebMCP tools via `navigator.modelContext` / `window.modelContext` and holds all JSON-LD, GA4 idle-loading, and theme scripts — it is large and central; most cross-cutting frontend changes land there.

## WordPress theme conventions

- Text domain is `computerjy` (enforced by `phpcs.xml`); every translatable string needs it, and placeholders need `/* translators: */` comments.
- Escape all dynamic output (`esc_html`, `esc_attr`, `esc_url`, `wp_kses_post`); use `wp_strip_all_tags` rather than `strip_tags`.
- `phpcs.xml` scans `.`, `template-parts/`, `inc/` and excludes `assets/`, `public/`, `dist/`, `.astro/`, `node_modules/`. Standalone PHP under `public/` (e.g. `markdown.php`) is intentionally outside the theme ruleset.
- Theme helpers live in `functions.php`: `computerjy_reading_time`, `computerjy_get_category_badge`, `computerjy_breadcrumbs`, `computerjy_pagination`, `computerjy_comment_callback`, plus customizer and widget registration.
- `inc/computerjy-rebuild-webhook.php` is a **WordPress plugin**, not a theme file, and is installed by hand on the
  origin (the deploy only touches the static webroot). It POSTs `repository_dispatch` to GitHub when content the
  build consumes changes; its hook set mirrors what `src/lib/wp-loader.ts` fetches, so it covers comments and term
  edits as well as posts. The token is the `COMPUTERJY_GITHUB_DISPATCH_TOKEN` constant in `wp-config.php`, never an
  option — this host keeps database backups on disk. See `deploy/wordpress-rebuild-trigger.md`.
- Packaging for install is the `zip -r` command in the README (root PHP files + `template-parts/` + `assets/`).

## Conventions

Commits follow Conventional Commits with a scope: `fix(security):`, `ci(phpcs):`, `feat(agent):`, `perf:`, `docs(rules):`.

Shell output is filtered by `rtk`; use `rtk proxy <cmd>` when you need raw `git`/`gh` output.

GitHub disables `schedule:` triggers after 60 days without a commit, which silently stops
`cloudflare-ip-monitor` and `cert-expiry-monitor` — both of which exist to catch failures that are
otherwise invisible. If the repo goes quiet, check the Actions tab for a disabled schedule.
