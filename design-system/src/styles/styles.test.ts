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
    expect(css).toContain("[data-theme='light']");
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
});
