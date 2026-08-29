---
name: build-and-verify
description: >-
  Use this skill when the user asks to build, test, check types, or verify the Astro static site build and its artifacts.
---

# Build and Verification Workflow

This skill guides the full validation and build pipeline for the ComputerJy Astro static frontend.

## Prerequisites

- Node.js 22+
- NPM dependencies installed (`npm ci` or `npm install`)

## Verification Steps

### 1. Run Unit Tests

Execute the Vitest test suite to verify post normalization, build verification helpers, and WordPress API client logic:

```bash
npm test
```

### 2. Check Types and Accessibility

Run Astro's integrated diagnostic check to detect TypeScript issues, broken component references, and accessibility hints:

```bash
npx astro check
```

### 3. Build Static Site

Compile the Astro frontend to the `dist/` directory:

```bash
npm run build
```

### 4. Verify Built Artifacts & Slugs

Run the verification script to validate that all required files, search index, RSS feed, and known article slugs exist in `dist/`:

```bash
npm run verify:build
```

## Troubleshooting Build Errors

- **Deprecated Zod / URL schema warnings**: Check `src/content.config.ts`.
- **Missing Slugs / 404s**: Check `scripts/known-slugs.json` against `src/data/posts.json` or live content loaders.
- **Dark Theme / Flash of Unstyled Content (FOUC)**: Ensure dark mode classes and properties are declared in `src/styles/global.css` and synced across `astro:after-swap` and `astro:page-load` in `src/layouts/BaseLayout.astro`.
