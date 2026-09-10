# design-sync notes — ComputerJy World

Repo-specific facts a future sync should not have to rediscover.

## What is being synced

`design-system/` is a **hand-ported React mirror** of the site's Astro
components, built specifically so this design system could be uploaded. It is
**not** production code. `src/components/*.astro` at the repo root remains
authoritative for https://www.computerjy.com.

The package is deliberately **not** an npm workspace. Keep it that way: the
root CI runs `npm audit --audit-level=high`, and a design-only dependency must
never be able to fail the live site's build.

## Build facts

- Converter entry: `--entry ./design-system/dist/index.js`,
  `--node-modules ./design-system/node_modules`. `PKG_DIR` resolves by walking
  up to the first `package.json` with a name, which lands on `design-system/`,
  so `cfg.cssEntry` and `cfg.tsconfig` are package-relative.
- `design-system/tsconfig.json` carries `"ignoreDeprecations": "6.0"`. Without
  it, tsup 8.5's dts plugin injects an implicit `baseUrl` that TypeScript 6.0.3
  rejects, and `.d.ts` emission fails.
- `npm run build` chains `build:css`, which needs `src/styles/global.css`.
- `package-validate.mjs` needs Playwright: `npm i -D playwright &&
npx playwright install chromium` inside `.ds-sync/`. Without it the render
  check silently does not run and validate exits 1.
- `[FONT_REMOTE] "Fira Code"` is expected and harmless — it is a fallback in
  the mono stack, not a loaded face. The three real brand faces are fetched
  from Google Fonts at runtime, hence `cfg.runtimeFontPrefixes`.
- `cfg.overrides.BentoShowcase.cardMode = "column"` exists because its Homepage
  story is wider than a grid cell and the product card crops it.

## Mirror-only divergences (deliberate — do not "fix" toward the site)

1. **`@custom-variant dark`** in `design-system/src/styles/global.css`.
   Tailwind v4's default `dark:` variant is gated on `prefers-color-scheme`,
   but this system themes via `:root` + `[data-theme='light']`. Without the
   variant a light-OS viewer gets the dark page background with white cards on
   top. The live site does **not** carry this line — fixing it there is
   issue #47. Verified in-browser: default renders page `rgb(11,15,25)` with
   cards `rgb(17,24,39)`; `data-theme="light"` flips to `rgb(248,250,252)` with
   white cards.
2. **`SocialShare` takes a real `url` prop.** The Astro original hardcodes the
   homepage in both share URLs, so sharing any article shares the homepage —
   issue #48.
3. **`Sidebar` takes `onSubscribe` instead of calling `alert()`.** A modal
   dialog blocks the design-preview runtime.

## Faithfully reproduced defects (leave alone)

- `shadow-glow-blue` generates no CSS — no `--shadow-glow-blue` token exists in
  the site's `@theme`. Dead in both surfaces. Issue #49.
- The sidebar newsletter email input has no accessible name. Issue #50.

## Re-sync risks — what can silently go stale

The mirror is hand-ported, so drift is managed, not prevented. Each of these is
duplicated from an Astro file that can change without notice:

- `design-system/src/styles/global.css` is a **copy** of `src/styles/global.css`
  plus exactly three documented edits (Google Fonts `@import`, absolute
  `circuit-pattern.svg` URL, the `@source inline` block) and the
  `@custom-variant dark` divergence above. Re-diff them on every sync.
- `HeroBanner`'s defaulted copy and its 500+ / 18+ / 100% stat trio.
- `Sidebar`'s author bio, tagline and the three social URLs.
- `fromPost()`'s fallbacks (`'Tech'`, `'3 min read'`) and the excerpt
  tag-stripping regex.
- Link construction: `/posts/`, `/category/`, `/tag/`, and the page-1-is-`/`
  pagination rule.
- `BentoShowcase`'s featured slot uses **different** fallbacks from `PostCard`
  (`'Featured'`, `'4 min read'`). That asymmetry is intentional.

## Partially verified / assumed

- Previews are graded from the converter's own render check plus a manual pass;
  there is no Storybook to diff against.
- The `_fixtures.ts` preview data uses absolute production URLs
  (`https://www.computerjy.com/logo-icon.svg`). If those assets move, previews
  show broken images.
- `Prose` paints no surface of its own, so its preview wraps it in
  `var(--bg-surface)`. On a bare white page its light text is invisible — the
  conventions header warns the design agent about this explicitly.
