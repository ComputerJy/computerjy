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

**One switch drives everything.** `data-theme` on `<html>` drives both the CSS
custom properties (`--bg-base`, …) and every Tailwind `dark:` utility — a
`@custom-variant dark` in `global.css` binds `dark:` to
`html:not([data-theme='light']) *`, the same condition the `:root` /
`[data-theme='light']` token override uses. There is no separate OS switch to
emulate: toggle `data-theme` on `<html>` (default absent = dark,
`data-theme="light"` = light) and both mechanisms move together.

Check surface colour and border, corner radius, font family and weight, spacing
rhythm, gradient direction, and hover state. Prefer reading computed styles over
judging by eye — several of the checks below are exact values.

## Findings

Verified 2026-09-10 by reading computed styles in Chrome, not by eye alone.
"Dark" and "Light" below name the page's `data-theme` state. **This run
predates commit `0a895b3`** (same day, later), which added the
`@custom-variant dark` declaration described above — see footnote ¹ for what
changed.

| Component     | Dark | Light | Notes                                                                                                             |
| ------------- | ---- | ----- | ----------------------------------------------------------------------------------------------------------------- |
| HeroBanner    | pass | pass  | `h1` resolves to Plus Jakarta Sans; stat tones render blue / pink / amber; badge is `display:flex` with `gap:6px` |
| BentoShowcase | pass | pass  | featured card `border-radius: 24px` = `rounded-3xl`, so the `CARD_BASE` + override composition resolves correctly |
| PostCard      | pass | pass  | background `rgb(17,24,39)` = `--bg-surface`                                                                       |
| Pagination    | pass | pass  | active page renders as `<span aria-current="page">`, not a link                                                   |
| SocialShare   | pass | pass  | no `dark:`-dependent surfaces                                                                                     |
| Sidebar       | pass | pass  | exactly 4 trending entries — `.slice(0, 4)` holds                                                                 |

Tokens confirmed exact: `--bg-base #0b0f19`, `--bg-surface #111827`,
`--text-primary #f8fafc`, `--brand-cyan #00d2ff`; `<html>` background
`rgb(11,15,25)`.

¹ **A previously-reproduced defect, now deliberately fixed in the mirror.**
This verification run predates `0a895b3` and originally found, with the OS in
light mode while the page theme stayed dark, that the page background stayed
dark (`rgb(11,15,25)`, from `:root`) while every card flipped to white
(`rgb(255,255,255)`) — `dark:bg-dark-surface` switched off (gated on
`prefers-color-scheme` at the time) while `bg-white` remained. That was
verified identically on https://www.computerjy.com/ (`<html class="dark"
data-theme="dark">`, page `rgb(11,15,25)`, first article card
`rgb(255,255,255)`), and at the time the mirror reproduced it faithfully, as
the fidelity rule requires. `0a895b3` deliberately **stopped** reproducing it:
`dark:` now tracks `data-theme` instead of the OS, so `dark:bg-dark-surface`
stays active whenever the page itself is dark, regardless of the OS setting —
this is a documented mirror-only divergence (`.design-sync/NOTES.md`). The
live site does not carry this fix; it is still tracked as issue #47.

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
