# ComputerJy 2.0 — WordPress theme

Classic PHP theme with a full `theme.json`. Text domain `computerjy2`, prefix
`computerjy2_`. Ships as the theme directory itself: this folder IS the theme
root (`style.css` + `index.php` at top level).

## Local development

```bash
# from the WordPress install
cp -r computerjy-2 wp-content/themes/
wp theme activate computerjy-2

# or with wp-env / Local / Studio, symlink the folder into wp-content/themes
```

The repo also carries the deploy tooling and tests. Deploy with
`deploy/deploy-theme.sh` — it stages the theme from an allowlist and copies
`public/` (agent-discovery files, `markdown.php`) into the WordPress
DocumentRoot, then flushes the W3TC page cache and purges Cloudflare so the
new asset versions reach visitors. `STAGE_ONLY=1` builds the tree without SSH.

`inc/computerjy-*.php` are standalone single-file plugins (currently the
edge-cache purge), hand-installed into `wp-content/plugins`, never required by
`functions.php`; their secrets are `wp-config.php` constants.

There is no build step. CSS and JS are hand-written and enqueued directly; do
not introduce a bundler without asking.

## Verification

- `npm test` — vitest over `tests/`: `scripts/`, `deploy/`, the vhost, and
  PHP helpers driven through `php -r` (files that must load from the CLI
  return early on `PHP_SAPI === 'cli'`, e.g. `public/markdown.php`).
- `composer install && composer lint` — phpcs with WordPress-Extra
  (`phpcs.xml`); `npm run lint:php` is the plain `php -l` sweep.
- No WordPress runs locally. WP-bound code is verified against the origin
  through an SSH tunnel (creds in `.env`):
  `ssh -i $KEY_PATH -f -N -L 8443:127.0.0.1:443 $SERVER_USER@$SERVER_HOST`, then
  `CONNECT_TO=www.computerjy.com:443:127.0.0.1:8443 MODE=wordpress LIVE_SLUGS=1 scripts/check-urls.sh`
  (or `curl --connect-to …`). On the server itself:
  `curl -sk --resolve www.computerjy.com:443:127.0.0.1 https://www.computerjy.com/…`.
  Run the same check without `CONNECT_TO` against the live edge after a deploy,
  with `EDGE=1` to assert the Cloudflare cache matrix (`cf-cache-status` per
  cookie / `Accept: text/markdown` / REST / static row, and the `s-maxage`).
- `deploy/lightsail-apache.conf` is read by `tests/apache-vhost.test.ts`: the
  `Link` header (the agent-discovery contract), the edge `Cache-Control`
  expression and the redirect rules it asserts must stay byte-identical.

Two static previews render the real `assets/css/theme.css` and
`assets/js/theme.js` with no WordPress: `preview-home.html`,
`preview-single.html`. Open them in a browser to check styling changes fast.
Keep them in sync when you change markup structure.

## Production (origin + Cloudflare)

- wp-cli on the origin: `sudo -u www-data wp --path=/var/www/wordpress …`.
  W3TC's `flush all` / `fix_environment` can take minutes — wrap in `timeout`.
- Cloudflare caches anonymous HTML for 1 h from the vhost's `s-maxage`. The
  Cache Rule **must** keep the `wordpress_logged_in_` / `wp-postpass_` /
  `comment_author_` cookie bypasses and the `Accept: text/markdown` bypass
  (`not any(http.request.headers["accept"][*] contains "text/markdown")`) —
  Cloudflare ignores `Vary`, so without it agents receive cached HTML. Manual
  purge: `wp eval 'computerjy_edge_cache_purge();'`.
- W3TC: page cache Disk:Enhanced, object cache APCu. Keep **off**: Browser
  Cache → HTML and "Other" `Cache-Control`/`Expires` (the latter put a 1-year
  `max-age` on REST JSON), `minify.*.http2push` (emits a `103` preload for a
  file that doesn't exist), the duplicate security headers. `search-index.json`
  and `markdown.php` are in the never-cache list.
- Yoast SEO owns sitemaps (`/sitemap_index.xml`; the vhost 301s the old URLs
  there). Comments render through Jetpack's hosted form. WP-Cron runs from
  `/etc/cron.d/computerjy-wp-cron`, not page loads.
- `public/` files are served straight from the docroot by the vhost's real-file
  check; Yoast also drops `llms.txt` there.

## Architecture

- `functions.php` — setup, image sizes, menus, widget areas, enqueues; requires
  everything in `inc/`.
- `inc/template-tags.php` — `computerjy2_reading_time()`,
  `computerjy2_category_chip()`, `computerjy2_breadcrumbs()`,
  `computerjy2_pagination()`, `computerjy2_eyebrow_strip()`,
  `computerjy2_byline_links()`, `computerjy2_thumb()` (falls back to
  `computerjy2_fallback_image_url()`: the Customizer "Default post image" or
  `assets/images/post-placeholder.svg`), `computerjy2_brand_mark()`.
- `inc/slots.php` — `computerjy2_slot( $id )` renders a height-reserved sponsor
  container. Slot ids: `leaderboard`, `infeed`, `inarticle`, `sidebar`. The
  in-article slot is injected by a `the_content` filter, not by a template.
- `inc/related.php` — related + trending queries, transient-cached, purged on
  `save_post`, `wp_insert_comment`, and common cache-plugin flush hooks.
- `inc/search-index.php` — serves `/search-index.json` (the ⌘K dataset the
  discovery layer advertises) in the shape the Astro build produced; transient
  `cjy2_search_index`, flushed with the related/trending caches.
- `inc/plugin-compat.php` — CF7, Jetpack, AMP, SEO plugins, cache plugins.
- `public/markdown.php` — `Accept: text/markdown` handler for agents, reads
  WordPress via `wp-load.php`. Contract: `.agents/rules/ai-agent-discovery.md`.
- `scripts/check-urls.sh` — URL parity checker (`MODE=astro|wordpress`,
  `LIVE_SLUGS=1`, `--print-urls`); run after any permalink or vhost change.
- `inc/customizer.php` — brand/social, layout, sponsor slots.
- `inc/comment-walker.php` — `computerjy2_comment()` callback (chat bubbles).
- `inc/block-patterns.php` — two patterns in the `computerjy2` category.

## Conventions

- **Styling lives in `assets/css/theme.css`**, organised in numbered sections.
  Colors come from the token block in §1 — never hardcode a hex in a component
  rule; add or reuse a `var(--*)`.
- **Dark is the default token set.** `[data-theme="light"]` overrides it. Any new
  color token must be defined in both blocks, and must clear WCAG AA (4.5:1) for
  body text on `--bg-base` in both.
- **Avoid class names containing `ad`, `ads`, `banner`, `share`, `social`** —
  browser filter lists hide them and the element vanishes for real visitors.
  This is why the share rails are `.byline-links` / `.post-links-row` and the
  footer icons are `.profile-links`.
- Square corners, hairline `1px` grid gaps via `.tile-grid`, monospace for
  furniture (`--font-mono`) and humanist for body copy (`--font-body`).
- Escape on output (`esc_html`, `esc_url`, `esc_attr`, `wp_kses_post`). The one
  deliberate exception is admin-entered sponsor markup in `inc/slots.php`.
- `phpcs.xml` applies WordPress-Extra: 4-space indent, Yoda conditions
  (`'publish' === $status`), spaces inside parentheses, text domain
  `computerjy2` (prefix `computerjy` is allowed only for the standalone
  plugins).
- Transients use the `cjy2_` prefix. `inc/related.php` stamps its keys with a
  generation number (`computerjy2_cache_key()`); `computerjy2_flush_caches()`
  bumps it on `save_post` / `wp_insert_comment` / `switch_theme`, which
  invalidates through any object cache (the origin runs APCu). Use
  `computerjy2_cache_key()` for new cached queries, or `delete_transient()`
  explicitly as `inc/search-index.php` does.

## Extension points

```php
add_filter( 'computerjy2_posts_per_page', fn() => 12 );
add_filter( 'computerjy2_infeed_interval', fn() => 4 );
add_filter( 'computerjy2_inarticle_after_paragraph', fn() => 2 );
add_filter( 'computerjy2_brand_accent_length', fn() => 2 );
add_action( 'computerjy2_slot_sidebar', 'my_sponsor_render' );
```

## Not done yet

- No `languages/*.pot` — run `wp i18n make-pot . languages/computerjy2.pot`.
- No RTL stylesheet (`rtl.css`).
- Trending is comment-count based; swap in real analytics if you have them.
