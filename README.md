# ComputerJy 2.0

A hybrid classic WordPress theme for computerjy.com: PHP templates plus a full
`theme.json` so the block editor matches the front end.

Direction: **Terminal** — hard-edged tiles separated by hairline grid gaps,
featured images tinted toward brand cyan, solid color category chips, monospace
furniture around humanist body copy.

## Install

```bash
cd theme && zip -r ../computerjy-2.zip . -x ".*"
```

Upload in **Appearance → Themes → Add New → Upload Theme**, then:

1. **Appearance → Menus** — assign *Primary Navigation* (Home, Tech Tips,
   Entertainment, Contact) and optionally *Footer Links*.
2. **Appearance → Customize → ComputerJy: Brand & Social** — eyebrow tagline
   and social URLs.
3. **Appearance → Customize → ComputerJy: Sponsor Slots** — paste AdSense or
   sponsor markup per slot.
4. **Settings → Reading** — posts per page (the theme defaults to 15).
5. Copy `logo-icon.svg` into `assets/images/` or set a custom logo.

## Templates

| File | Covers |
| --- | --- |
| `index.php` | Home / blog feed: lead block + Latest grid |
| `front-page.php` | Static front page, else the feed |
| `single.php` + `template-parts/content-single.php` | Single post |
| `page.php` | Page (narrow reading shell) |
| `page-templates/full-width.php` | Full-width page template |
| `page-templates/landing.php` | Edge-to-edge landing page template |
| `archive.php` | Generic archive |
| `category.php` | Category archive with hero band |
| `tag.php`, `date.php` | Delegate to `archive.php` |
| `author.php` | Author profile page |
| `search.php`, `searchform.php` | Search results and form |
| `404.php` | Not found + latest posts |
| `comments.php` | Chat-bubble comment thread |
| `sidebar.php` | Author, trending, categories, tags, sticky slot, widgets |

## Layout slots

`computerjy2_slot( $id )` renders a height-reserved container so filling it
never shifts layout. Slots: `leaderboard`, `infeed`, `inarticle`, `sidebar`.

Fill a slot three ways:

- paste markup in the Customizer,
- `add_action( 'computerjy2_slot_inarticle', $callback )`,
- let a plugin inject into the container.

Filters: `computerjy2_infeed_interval`, `computerjy2_inarticle_after_paragraph`,
`computerjy2_posts_per_page`, `computerjy2_content_width`.

## Plugin support

- **Gutenberg** — `theme.json` (palette, gradients, duotones, type scale,
  spacing, block styles) plus `assets/css/editor-style.css`; two block patterns.
- **Yoast SEO / Rank Math** — breadcrumbs defer to whichever is active;
  primary-term selection is honoured by the category chip.
- **Contact Form 7** — themed inputs; CF7's CSS/JS is dequeued on pages with no
  form; `wpcf7_autop` disabled.
- **Jetpack** — infinite scroll (click-to-load on `#primary-feed`), responsive
  videos, content options, related-posts de-duplication.
- **AdSense / sponsor plugins** — the reserved slots above.
- **Caching plugins** — related and trending queries are transient-backed and
  purge on publish, on comment, and on the common cache-flush hooks.
- **AMP** — the JS bundle is dequeued on AMP requests; all layout is CSS-only.

## Theme modes

Dark is the default token set. `data-theme="light"` flips every token. On first
visit the theme follows the OS setting; the header toggle persists an explicit
choice in `localStorage`.
