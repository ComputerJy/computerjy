---
name: wordpress-theme-lint
description: >-
  Use this skill when developing, linting, modifying, or packaging PHP files and WordPress theme templates in this repository.
---

# WordPress Theme Linting & Standards

This skill guides PHP linting, security checking, and theme packaging for the classic WordPress theme backend.

## PHP Syntax Verification

Run a syntax check across all root, template, and include PHP files:

```bash
find . -maxdepth 3 -name "*.php" -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/.astro/*" -exec php -l {} +
```

## WordPress Coding Standards & Security Guidelines

When modifying theme files:

1. **Text Domain**: All translatable strings must use `'computerjy'` text-domain:
   ```php
   esc_html_e( 'Read more', 'computerjy' );
   /* translators: %s: Author name */
   printf( esc_html__( 'By %s', 'computerjy' ), esc_html( $author ) );
   ```
2. **Output Escaping**: Never output raw variables:
   - Use `esc_html()` for plain text.
   - Use `esc_attr()` for HTML attributes.
   - Use `esc_url()` for URLs.
   - Use `wp_kses_post()` for trusted rich HTML.
   - Use `wp_strip_all_tags()` instead of native `strip_tags()`.
3. **Stand-alone files**: Files under `public/` (such as `public/markdown.php`) and plugin files (`inc/computerjy-rebuild-webhook.php`) are maintained separately from the core theme template files.

## Packaging the Theme

To package the theme files for uploading to `/wp-admin/themes.php`:

```bash
zip -r computerjy-theme.zip *.php style.css screenshot.png template-parts/ assets/ inc/ -x "node_modules/*" -x "dist/*"
```
