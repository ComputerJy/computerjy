## ComputerJy World — how to build with this system

Ten components ported from the live site at https://www.computerjy.com. No
provider, no context, no theme wrapper: every component is a plain function.
The only requirement is that `styles.css` is loaded.

### Theme: dark by default

Dark is not a mode you opt into — it is the default, defined in `:root`. Opt
**out** by setting `data-theme="light"` on `<html>`. That single attribute
drives both the CSS custom properties and every `dark:` utility, so the page
never ends up half-themed.

```jsx
<html>                          {/* dark — the brand default */}
<html data-theme="light">       {/* light */}
```

### The one mistake that silently breaks a page

Components that paint their own surface (`PostCard`, `BentoShowcase`,
`Sidebar`, `Card`) are safe anywhere. Components that do **not** — `Prose`,
`GradientText`, `Badge` — inherit the page's text colours, which are light
because the system is dark. Drop them on a white background and the text
disappears.

So: give your own layout a surface from the token layer, never a bare white
page.

```jsx
<div style={{ background: 'var(--bg-base)' }}>     {/* page */}
  <div style={{ background: 'var(--bg-surface)' }}> {/* panel */}
```

Use `var(--*)` rather than fixed utilities like `bg-dark-surface` when you want
the value to follow the theme — the fixed ones do not flip under
`data-theme="light"`.

### Styling idiom: Tailwind v4 utilities + CSS custom properties

Tokens (theme-aware, prefer these for colour):
`--bg-base`, `--bg-surface`, `--bg-elevated`, `--bg-subtle`, `--bg-glass`,
`--text-primary`, `--text-secondary`, `--text-muted`, `--text-subtle`,
`--border-color`, `--border-hover`,
`--grad-primary`, `--grad-accent`, `--grad-badge`,
`--brand-cyan`, `--brand-blue`, `--brand-purple`, `--brand-pink`,
`--brand-orange`, `--brand-amber`, `--brand-green`.

Component classes you can apply directly:
`.badge-glow`, `.text-gradient`, `.text-gradient-accent`, `.bg-grad-primary`,
`.bg-grad-accent`, `.glass-header`, `.prose-custom`.

Utility families guaranteed to exist (force-generated — anything outside these
may not be in the stylesheet):

| Family      | Examples                                              |
| ----------- | ----------------------------------------------------- |
| Layout      | `flex`, `grid`, `grid-cols-3`, `lg:col-span-7`        |
| Spacing     | `p-6`, `px-4`, `mt-8`, `gap-6`                        |
| Sizing      | `w-full`, `h-full`, `max-w-4xl`                       |
| Type        | `text-sm`, `text-4xl`, `font-heading`, `font-black`   |
| Brand color | `text-brand-cyan`, `bg-brand-purple`                  |
| Slate scale | `text-slate-400`, `bg-slate-900`, `dark:bg-slate-800` |
| Shape       | `rounded-2xl`, `rounded-full`, `shadow-xs`            |
| Text detail | `leading-relaxed`, `tracking-wider`, `line-clamp-2`   |

`font-heading` is Plus Jakarta Sans, `font-body` is Inter, `font-mono` is
JetBrains Mono. Headings default to Plus Jakarta Sans at weight 800.

### Where the truth lives

Read `styles.css` and the file it imports (`_ds_bundle.css`) before styling —
they hold every token and component class verbatim. Each component's
`.prompt.md` carries its real prop contract.

### A page, idiomatically

```jsx
<div style={{ background: 'var(--bg-base)' }} className="min-h-screen p-8">
  <HeroBanner />
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {posts.map((p) => (
      <PostCard key={p.href} {...p} />
    ))}
  </div>
  <Pagination currentPage={1} totalPages={12} />
</div>
```

`HeroBanner` renders the site's real copy with no props; every string is
overridable. `fromPost(wpPost)` maps a WordPress post onto `PostCard`'s props.
