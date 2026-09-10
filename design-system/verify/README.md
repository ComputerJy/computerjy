# Visual verification

Compares every ported component in `design-system/verify/harness.html` against the
live Astro render on https://www.computerjy.com, in both themes. The package shape
has no reference render otherwise, so this is the strongest check available.

## How to run it

```bash
cd design-system && npm run build
cd design-system && python3 -m http.server 4321   # serves the harness
cd .. && npm run dev                               # serves the live-equivalent Astro site
```

Open `http://localhost:4321/verify/harness.html` alongside the Astro dev server's
homepage. Dark is the default theme; toggle light by setting
`data-theme="light"` on `<html>` in devtools.

For each component, check: surface color and border, corner radius, font family
and weight, spacing rhythm, gradient direction, and hover state.

## Findings

| Component     | Dark      | Light     | Notes |
| ------------- | --------- | --------- | ----- |
| HeroBanner    | (pending) | (pending) |       |
| BentoShowcase | (pending) | (pending) |       |
| PostCard      | (pending) | (pending) |       |
| Pagination    | (pending) | (pending) |       |
| SocialShare   | (pending) | (pending) |       |
| Sidebar       | (pending) | (pending) |       |

## Expected differences (not bugs)

- The `shadow-glow-blue` hover on `Pagination`/`BentoShowcase` does nothing in
  both the harness and the live site — the token was never defined.
- The body circuit-pattern texture appears in the harness only if the
  production URL it references is reachable.

Any other mismatch is a porting bug: fix the component, re-run its tests,
rebuild, and re-check before proceeding to Task 12.
