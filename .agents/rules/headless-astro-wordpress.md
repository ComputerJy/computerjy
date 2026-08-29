---
description: Best practices and guardrails for Headless Astro 5, Tailwind v4, and WordPress deployments
always_on: true
---

# Headless Astro 5 & WordPress Engineering Guidelines

## 1. Tailwind CSS v4 + Astro 5 Integration

- Always integrate Tailwind v4 using `@tailwindcss/vite` in `astro.config.mjs`:
  ```js
  import { defineConfig } from 'astro/config';
  import tailwindcss from '@tailwindcss/vite';

  export default defineConfig({
    vite: {
      plugins: [tailwindcss()],
    },
  });
  ```
- Do NOT use `@astrojs/tailwind` (which targets Tailwind v3 and causes setup hook errors with Vite 6).

## 2. Theme State & Zero-FOUC Invariants

- For dark-first websites, define dark theme custom properties directly in `:root` inside `global.css`.
- Ensure `<html>` markup includes `class="dark" data-theme="dark"` statically.
- When using Astro's `<ClientRouter />` / View Transitions, always register theme sync on `astro:after-swap` and `astro:page-load` to prevent white background flashes.

## 3. Deployment Scripts & Secrets Isolation

- Never hardcode server IPs, SSH usernames, or key paths in repository scripts.
- Deployment scripts must source environment variables dynamically from `.env` (which must be in `.gitignore`).
- For GitHub Actions workflows:
  - Reference secrets using `${{ secrets.LIGHTSAIL_HOST }}` and `${{ secrets.LIGHTSAIL_SSH_KEY }}`.
  - Always declare explicit least-privilege permissions:
    ```yaml
    permissions:
      contents: read
    ```

## 4. WordPress Ingestion & HTML Sanitization

- When parsing raw WordPress XML exports in Python, strip invalid XML 1.0 control bytes using `bytes.translate(None, illegal_bytes)` instead of broad regex ranges.
- Avoid regex blacklist sanitization and iterative replacement loops (which trigger CodeQL `js/incomplete-sanitization`). Instead, use an **escape-first whitelist** pattern: completely escape all HTML special characters first (`escapeHtml`), and then restore only strictly attribute-free whitelisted tags (e.g. `<b>`, `<i>`, `<code>`, `<p>`, `<br />`). Always unescape `&amp;` last.
