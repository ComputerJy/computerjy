import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = resolve(import.meta.dirname, '../../dist/styles.css');
const VOCABULARY = resolve(import.meta.dirname, './VOCABULARY.md');

/**
 * Pulls every class name out of the "Example" column of VOCABULARY.md's
 * markdown table, so the test and the doc cannot drift apart. Parses the
 * table structurally (by `|`-separated cells) rather than scanning for
 * class-shaped substrings anywhere in the file.
 */
function classesFromVocabularyTable(markdown: string): string[] {
  const classNamePattern = /^[a-zA-Z0-9:./-]+$/;
  const classes = new Set<string>();

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;

    const cells = trimmed
      .slice(1, -1)
      .split('|')
      .map((cell) => cell.trim());
    if (cells.length < 2) continue;

    const [family, example] = cells;
    if (family === 'Family') continue; // header row
    if (/^-+$/.test(family)) continue; // separator row

    for (const token of example.split(',').map((t) => t.trim())) {
      // Skip non-class tokens (prose, empty cells) rather than asserting on them.
      if (token && classNamePattern.test(token)) {
        classes.add(token);
      }
    }
  }

  return Array.from(classes);
}

/** Tailwind escapes `:`, `/` and `.` in the class selectors it generates. */
function cssSelectorFor(className: string): string {
  return `.${className.replace(/([:./])/g, '\\$1')}`;
}

describe('compiled stylesheet', () => {
  it('exists — run `npm run build:css` first', () => {
    expect(existsSync(CSS)).toBe(true);
  });

  it('defines the brand tokens', () => {
    const css = readFileSync(CSS, 'utf8');
    expect(css).toContain('--color-brand-cyan');
    expect(css).toContain('--grad-primary');
  });

  it('keeps dark as the default theme in :root, not behind a .dark class', () => {
    const css = readFileSync(CSS, 'utf8');
    // `[data-theme='light']` alone is too weak a substring to pin this: the
    // @custom-variant dark declaration also produces it, inside
    // `:where(html:not([data-theme='light']) *)` selectors — that string
    // would still be present even if the light-theme token override below
    // were deleted entirely. Assert the actual light-theme token block
    // instead, by its selector plus a token value it defines.
    expect(css).toMatch(
      /\[data-theme='light'\][^{]*\{[^}]*--bg-base:\s*#f8fafc/
    );
    expect(css).toMatch(/:root\s*\{[^}]*--bg-base:\s*#0b0f19/);
  });

  it('ships the component classes', () => {
    const css = readFileSync(CSS, 'utf8');
    for (const cls of [
      '.badge-glow',
      '.text-gradient',
      '.glass-header',
      '.prose-custom',
      '.bg-grad-primary',
    ]) {
      expect(css).toContain(cls);
    }
  });

  it('emits utilities the components never use, for the agent layout glue', () => {
    const css = readFileSync(CSS, 'utf8');
    for (const cls of [
      '.max-w-4xl',
      '.grid-cols-6',
      '.gap-10',
      '.text-4xl',
      '.rounded-lg',
    ]) {
      expect(css).toContain(cls);
    }
  });

  it('ships every example class documented in VOCABULARY.md, parsed from the table itself', () => {
    const classes = classesFromVocabularyTable(
      readFileSync(VOCABULARY, 'utf8')
    );
    // Sanity-check the parser actually found the table, not an empty/malformed file.
    expect(classes.length).toBeGreaterThan(50);

    const css = readFileSync(CSS, 'utf8');
    const missing = classes.filter((cls) => !css.includes(cssSelectorFor(cls)));
    expect(missing).toEqual([]);
  });
  // --- Colour contrast (WCAG 2.1 AA) -----------------------------------------
  // Light theme inherits the site's palette, where several brand colours fail
  // as body text on a light surface. These pin the mirror-only overrides that
  // fix them, so a palette change cannot silently regress accessibility.

  /** Relative luminance per WCAG 2.1. */
  const luminance = (hex: string): number => {
    const h = hex.replace('#', '');
    const ch = [0, 2, 4].map((i) => {
      const v = parseInt(h.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };

  /** Contrast ratio between two hex colours, per WCAG 2.1. */
  const contrast = (a: string, b: string): number => {
    const [l1, l2] = [luminance(a), luminance(b)];
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  /**
   * Value of a custom property declared in the light-theme rule block.
   *
   * Matches the block itself rather than slicing from the first occurrence of
   * the selector text: Tailwind emits `:where(html:not([data-theme='light']))`
   * utilities *before* the authored `:root` block, so a naive slice picks up
   * the dark-theme declaration instead.
   */
  const lightThemeToken = (css: string, name: string): string => {
    const block = css.match(
      /\[data-theme='light'\],\s*html\.light\s*\{([^}]*)\}/
    );
    if (!block) throw new Error('light-theme rule block not found');
    const m = block[1].match(
      new RegExp(`(?:^|[;\\s])${name}:\\s*(#[0-9a-fA-F]{6})`)
    );
    if (!m) throw new Error(`${name} not declared under [data-theme='light']`);
    return m[1];
  };

  const WHITE = '#ffffff';
  const LIGHT_SUBTLE = '#f1f5f9';

  it('the contrast helper matches known WCAG values', () => {
    expect(Math.round(contrast('#000000', WHITE) * 100) / 100).toBe(21);
    expect(Math.round(contrast(WHITE, WHITE) * 100) / 100).toBe(1);
  });

  it('brand blue is legible as body text in the light theme', () => {
    const css = readFileSync(CSS, 'utf8');
    for (const token of ['--color-brand-blue', '--brand-blue']) {
      const value = lightThemeToken(css, token);
      expect(contrast(value, WHITE)).toBeGreaterThanOrEqual(4.5);
      // It also backs hover:bg-brand-blue with white text.
      expect(contrast(WHITE, value)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('the light-theme amber label override is legible on white', () => {
    const css = readFileSync(CSS, 'utf8');
    const m = css.match(
      /\[data-theme='light'\][^{]*\.text-amber-600[^{]*\{[^}]*color:\s*(#[0-9a-fA-F]{6})/
    );
    expect(m, 'light-theme .text-amber-600 override not found').not.toBeNull();
    expect(contrast(m![1], WHITE)).toBeGreaterThanOrEqual(4.5);
  });

  it('prose inline code is legible on the light subtle surface', () => {
    const css = readFileSync(CSS, 'utf8');
    const m = css.match(
      /\[data-theme='light'\][^{]*\.prose-custom code[^{]*\{[^}]*color:\s*(#[0-9a-fA-F]{6})/
    );
    expect(
      m,
      'light-theme .prose-custom code override not found'
    ).not.toBeNull();
    expect(contrast(m![1], LIGHT_SUBTLE)).toBeGreaterThanOrEqual(4.5);
  });

  it('dark-theme brand colours already clear AA on the dark surface', () => {
    const DARK_SURFACE = '#111827';
    for (const [name, hex] of [
      ['brand-blue', '#0080ff'],
      ['brand-pink', '#ff4d6d'],
      ['brand-amber', '#ff9f1c'],
    ] as const) {
      expect(contrast(hex, DARK_SURFACE), name).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('advertised text tokens clear AA on every surface they can sit on', () => {
    const css = readFileSync(CSS, 'utf8');
    const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}/);
    expect(rootBlock, ':root block not found').not.toBeNull();
    const tokenIn = (block: string, name: string) => {
      const m = block.match(
        new RegExp(`(?:^|[;\\s])${name}:\\s*(#[0-9a-fA-F]{6})`)
      );
      if (!m) throw new Error(`${name} not declared`);
      return m[1];
    };
    // conventions.md advertises these to the design agent, so they must be usable.
    const DARK_SURFACES = ['#0b0f19', '#111827', '#1f2937', '#182234'];
    const LIGHT_SURFACES = ['#f8fafc', '#ffffff', '#f1f5f9'];
    for (const name of ['--text-muted', '--text-subtle']) {
      const dark = tokenIn(rootBlock![1], name);
      for (const bg of DARK_SURFACES) {
        expect(contrast(dark, bg), `${name} on ${bg}`).toBeGreaterThanOrEqual(
          4.5
        );
      }
      const light = lightThemeToken(css, name);
      for (const bg of LIGHT_SURFACES) {
        expect(contrast(light, bg), `${name} on ${bg}`).toBeGreaterThanOrEqual(
          4.5
        );
      }
    }
  });
});
