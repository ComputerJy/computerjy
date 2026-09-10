# @computerjy/design-system

A **design-system mirror** of the ComputerJy World frontend, published to
claude.ai/design via `/design-sync`. **This is not production code.**

`src/components/*.astro` in the repo root remains authoritative for the live
site at https://www.computerjy.com. Nothing here is imported by the Astro
build, and this package is deliberately not an npm workspace, so it never
enters the root dependency tree that CI installs and audits.

Components here are hand-ported and therefore drift. See
`.design-sync/NOTES.md` for the re-sync risk list.

## Build

    npm install
    npm run build     # dist/index.js, dist/index.d.ts, dist/styles.css
    npm test
