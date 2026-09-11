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

The repo also carries the deploy tooling, tests and (until the cutover
finishes, see `MIGRATION.md`) the retired Cloudflare Worker. Deploy with
`deploy/deploy-theme.sh` — it stages the theme from an allowlist and copies
`public/` (agent-discovery files, `markdown.php`) into the WordPress
DocumentRoot. `STAGE_ONLY=1` builds the tree without SSH.

`inc/computerjy-*.php` are standalone single-file plugins (currently the
edge-cache purge), hand-installed into `wp-content/plugins`, never required by
`functions.php`; their secrets are `wp-config.php` constants.

There is no build step. CSS and JS are hand-written and enqueued directly; do
not introduce a bundler without asking.

## Verification

- `npm test` — vitest over `tests/`: the Worker, `scripts/`, `deploy/`, and
  PHP helpers driven through `php -r` (files that must load from the CLI
  return early on `PHP_SAPI === 'cli'`, e.g. `public/markdown.php`).
- `composer install && composer lint` — phpcs with WordPress-Extra
  (`phpcs.xml`); `npm run lint:php` is the plain `php -l` sweep.
- No WordPress runs locally. WP-bound code is verified against the origin
  through an SSH tunnel: `CONNECT_TO=… scripts/check-urls.sh`.
- `deploy/lightsail-apache.conf` is read by `tests/edge-router.test.ts` and
  `tests/apache-vhost.test.ts`: the `Link` header, the five security headers,
  the Jetpack root rewrite and `Alias /wp-cron.php` must stay byte-identical.

Two static previews render the real `assets/css/theme.css` and
`assets/js/theme.js` with no WordPress: `preview-home.html`,
`preview-single.html`. Open them in a browser to check styling changes fast.
Keep them in sync when you change markup structure.

## Architecture

- `functions.php` — setup, image sizes, menus, widget areas, enqueues; requires
  everything in `inc/`.
- `inc/template-tags.php` — `computerjy2_reading_time()`,
  `computerjy2_category_chip()`, `computerjy2_breadcrumbs()`,
  `computerjy2_pagination()`, `computerjy2_eyebrow_strip()`,
  `computerjy2_byline_links()`, `computerjy2_thumb()`,
  `computerjy2_brand_mark()`.
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
- Transients use the `cjy2_` prefix; `computerjy2_flush_caches()` in
  `inc/related.php` sweeps `_transient_cjy2_*` on `save_post` /
  `wp_insert_comment` / `switch_theme`. That sweep is raw SQL, so anything
  that must also invalidate under a persistent object cache calls
  `delete_transient()` itself (see `inc/search-index.php`).

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
- Featured images are tinted with a CSS `filter` at rest and un-tinted on hover.
  Verify this reads well against the real photo library before shipping.
