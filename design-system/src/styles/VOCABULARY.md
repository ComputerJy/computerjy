# Utility Vocabulary

`dist/styles.css` is compiled with Tailwind v4's `@source inline(...)` directive
(see the bottom of `global.css`), which force-generates every utility listed
below regardless of whether the ten ported components use it. Tailwind only
ever emits utilities it can see in scanned source — a design agent writing its
own layout markup against this stylesheet needs classes the components
themselves never reference (`grid-cols-3`, `max-w-4xl`, `gap-6`, ...), so this
table is the contract for what is guaranteed to exist.

Every example below was checked against the compiled `dist/styles.css` — see
the verification loop below the table.

| Family                   | Example                                                 | Notes                                                                      |
| ------------------------ | ------------------------------------------------------- | -------------------------------------------------------------------------- |
| Display                  | flex, inline-flex, grid, block, inline-block, hidden    | base display keywords                                                      |
| Flex direction/wrap/grow | flex-col, flex-row, flex-wrap, flex-grow, flex-shrink-0 | flex-container/item modifiers                                              |
| Flex/grid alignment      | items-center, justify-between                           | `{items,justify}-{start,end,center,between,around}`                        |
| Grid columns             | grid-cols-3, grid-cols-6                                | 1,2,3,4,5,6,12                                                             |
| Grid columns (lg)        | lg:grid-cols-3, lg:grid-cols-6                          | same scale, `lg:` breakpoint                                               |
| Grid/flex span           | col-span-2, row-span-3                                  | `{col,row}-span-{1,2,3,4,5,6,7,8,12}`                                      |
| Grid span (lg)           | lg:col-span-2, lg:col-span-8                            | `lg:col-span-{1,2,3,4,5,6,7,8,12}` only — `row-span` has no `lg:` variant  |
| Gap                      | gap-6, gap-10                                           | 0,1,1.5,2,2.5,3,4,5,6,8,10,12                                              |
| Padding                  | p-6, px-4, pt-2                                         | `{p,px,py,pt,pr,pb,pl}` × 0,1,1.5,2,2.5,3,4,5,6,8,10,12,16                 |
| Margin                   | mt-8, mx-auto                                           | `{m,mx,my,mt,mr,mb,ml}` × 0,1,2,3,4,5,6,8,10,12,auto                       |
| Sizing                   | w-full, h-screen, w-12                                  | `{w,h}-{full,auto,screen,4,6,8,10,12,16,20,24}`                            |
| Max width                | max-w-4xl, max-w-prose                                  | xs,sm,md,lg,xl,2xl,3xl,4xl,5xl,6xl,7xl,full,prose                          |
| Font size                | text-4xl, text-sm                                       | xs,sm,base,lg,xl,2xl,3xl,4xl,5xl                                           |
| Font weight              | font-semibold, font-black                               | normal,medium,semibold,bold,extrabold,black                                |
| Font family              | font-heading, font-body, font-mono                      | maps to the theme's `--font-heading`/`--font-body`/`--font-mono`           |
| Brand color              | text-brand-cyan, bg-brand-purple                        | 11 brand hues, on text/bg/border                                           |
| Surface color            | bg-dark-surface, text-light-subtle                      | `{dark,light}-{base,surface,elevated,subtle}`, on text/bg/border           |
| Slate scale              | text-slate-400, border-slate-700                        | 100–900, on text/bg/border                                                 |
| Slate scale (dark:)      | dark:bg-slate-800, dark:text-slate-200                  | same scale, `dark:` variant                                                |
| Border radius            | rounded-lg, rounded-full                                | none,sm,md,lg,xl,2xl,3xl,full                                              |
| Shadow                   | shadow-md, shadow-xl                                    | xs,sm,md,lg,xl,none                                                        |
| Line-height / tracking   | leading-relaxed, tracking-wide                          | `{leading,tracking}-{tight,snug,normal,relaxed,wide,wider}`                |
| Line clamp               | line-clamp-2, line-clamp-4                              | 1,2,3,4                                                                    |
| Text transform/align     | uppercase, truncate, text-center                        | uppercase,lowercase,capitalize,truncate,text-center,text-left,text-right   |
| Positioning/overflow     | relative, absolute, z-20, overflow-hidden               | relative,absolute,fixed,sticky,z-10,z-20,z-50,overflow-hidden,object-cover |
| Transition               | transition-colors, transition-transform                 | all,colors,transform                                                       |
| Duration                 | duration-200, duration-500                              | 75,150,200,300,500                                                         |

## Verification loop

Run this after any change to the `@source inline(...)` block or the
`safelist.txt` fallback, and before committing — every line must read `ok`:

```bash
cd /home/eyad/code/computerjy/design-system
for c in p-6 px-4 mt-8 text-brand-cyan bg-brand-purple max-w-4xl line-clamp-2; do
  grep -q "\.$c" dist/styles.css && echo "ok  $c" || echo "MISSING  $c"
done
```
