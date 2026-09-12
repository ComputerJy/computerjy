// CLAUDE.md: every text token must clear WCAG AA (4.5:1) on the backgrounds
// of its palette, in both the dark default and the [data-theme='light']
// override. Parses the token blocks in theme.css §1 so a colour tweak that
// drops below AA fails here instead of in a live audit (#75).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('assets/css/theme.css', 'utf8');

function tokens(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi))
    out[m[1]] = m[2].toLowerCase();
  return out;
}
const darkBlock = css.slice(
  css.indexOf(':root'),
  css.indexOf("[data-theme='light']")
);
const lightBlock = css.slice(
  css.indexOf("[data-theme='light']"),
  css.indexOf('/* ---------- 2.')
);
const dark = tokens(darkBlock);
// The light palette only overrides some tokens; the rest inherit from dark.
const light = { ...dark, ...tokens(lightBlock) };

const lum = (hex: string) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT = [
  'text-primary',
  'text-body',
  'text-secondary',
  'text-muted',
  'text-subtle',
  'brand-cyan',
  'text-accent-blue',
  'text-accent-purple',
  'text-error',
];
const BG = ['bg-base', 'bg-surface', 'bg-elevated'];

describe.each([
  ['dark', dark],
  ['light', light],
])('%s palette', (_name, t) => {
  it('defines every text and background token', () => {
    for (const k of [...TEXT, ...BG, 'chip-fg'])
      expect(t[k], k).toMatch(/^#[0-9a-f]{6}$/);
  });

  it.each(TEXT.flatMap((fg) => BG.map((bg) => [fg, bg])))(
    '%s on %s is at least 4.5:1',
    (fg, bg) => {
      expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
    }
  );

  it('chip text on the cyan chip background is at least 4.5:1', () => {
    expect(ratio(t['chip-fg'], t['brand-cyan'])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('brand colours are not used as text', () => {
  // --brand-blue / purple / pink fail AA as text in at least one palette; the
  // --text-accent-* / --text-error tokens exist for that.
  it.each(['brand-blue', 'brand-purple', 'brand-pink', 'brand-orange'])(
    'color: var(--%s) does not appear',
    (name) => {
      expect(css).not.toMatch(
        new RegExp(`(^|[^-])color:\\s*var\\(--${name}\\)`, 'm')
      );
    }
  );
});
