import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = resolve(import.meta.dirname, '../../dist/styles.css');

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
});
