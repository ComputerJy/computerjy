# Visual verification

Compares every ported component in `design-system/verify/harness.html` against the
live render at https://www.computerjy.com. The package shape has no reference
render otherwise, so this is the strongest check available.

## How to run it

```bash
cd design-system && npm run build
cd design-system && python3 -m http.server 4321   # serves the harness
```

Open `http://localhost:4321/verify/harness.html`. The live site itself is the
reference — it does not need a local Astro build.

**Two independent switches must both be exercised**, because this design system
has two theming mechanisms that are not wired together:

1. `data-theme` on `<html>` drives the CSS custom properties (`--bg-base`, …).
2. `prefers-color-scheme` drives every Tailwind `dark:` utility, because no
   `@custom-variant dark` is declared. Emulate it in devtools
   (Rendering → Emulate CSS media feature `prefers-color-scheme`).

Check surface colour and border, corner radius, font family and weight, spacing
rhythm, gradient direction, and hover state. Prefer reading computed styles over
judging by eye — several of the checks below are exact values.

## Findings

Verified 2026-09-10 by reading computed styles in Chrome, not by eye alone.
"Dark" and "Light" below name the **OS** colour-scheme state.

| Component     | Dark | Light | Notes                                                                                                             |
| ------------- | ---- | ----- | ----------------------------------------------------------------------------------------------------------------- |
| HeroBanner    | pass | see ¹ | `h1` resolves to Plus Jakarta Sans; stat tones render blue / pink / amber; badge is `display:flex` with `gap:6px` |
| BentoShowcase | pass | see ¹ | featured card `border-radius: 24px` = `rounded-3xl`, so the `CARD_BASE` + override composition resolves correctly |
| PostCard      | pass | see ¹ | background `rgb(17,24,39)` = `--bg-surface`                                                                       |
| Pagination    | pass | pass  | active page renders as `<span aria-current="page">`, not a link                                                   |
| SocialShare   | pass | pass  | no `dark:`-dependent surfaces                                                                                     |
| Sidebar       | pass | see ¹ | exactly 4 trending entries — `.slice(0, 4)` holds                                                                 |

Tokens confirmed exact: `--bg-base #0b0f19`, `--bg-surface #111827`,
`--text-primary #f8fafc`, `--brand-cyan #00d2ff`; `<html>` background
`rgb(11,15,25)`.

¹ **Not a porting defect — reproduced on the live site.** With the OS in light
mode while the page theme stays dark, the page background stays dark
(`rgb(11,15,25)`, from `:root`) while every card flips to white
(`rgb(255,255,255)`) — `dark:bg-dark-surface` switches off and `bg-white`
remains. Verified identically on https://www.computerjy.com/ (`<html
class="dark" data-theme="dark">`, page `rgb(11,15,25)`, first article card
`rgb(255,255,255)`). The mirror reproduces this faithfully, as the fidelity rule
requires. Tracked as issue #47.

## Expected differences (not bugs)

- The `shadow-glow-blue` hover on `Pagination`/`BentoShowcase` does nothing in
  both the harness and the live site — the token was never defined. Issue #49.
- The body circuit-pattern texture appears in the harness only if the
  production URL it references is reachable.
- The harness needs an import map: the built bundle imports the bare specifier
  `react/jsx-runtime`, which browsers cannot resolve on their own. Serving the
  files and importing them under Node both succeed regardless — only loading the
  page in a browser proves it renders.

Any other mismatch is a porting bug: fix the component, re-run its tests,
rebuild, and re-check.
