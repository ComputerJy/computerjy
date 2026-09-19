// #144 / #145: nothing render-blocking in <head>. theme.css ships inline
// under a src-less handle, only the two LCP-relevant fonts are preloaded and
// gtag.js is injected after interaction / idle instead of async in <head>.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const php = readFileSync('functions.php', 'utf8');

describe('functions.php head assets', () => {
  it('inlines theme.css instead of enqueuing it as a file', () => {
    expect(php).toMatch(/wp_register_style\(\s*'computerjy2-theme',\s*false/);
    expect(php).not.toMatch(
      /wp_enqueue_style\(\s*'computerjy2-theme',\s*get_template_directory_uri/
    );
    expect(php).toContain('computerjy2_inline_theme_css()');
  });

  it('preloads only the body and heading faces', () => {
    const list =
      php.match(/foreach \( array\( ([^)]*) \) as \$file \)/)?.[1] ?? '';
    expect(list).toContain("'inter-latin'");
    expect(list).toContain("'plus-jakarta-sans-latin'");
    expect(list).not.toContain('jetbrains-mono');
  });

  it('does not load gtag.js with an async <script src> in <head>', () => {
    expect(php).not.toMatch(/<script async src=/);
    expect(php).toMatch(/document\.createElement\('script'\)/);
    expect(php).toMatch(/addEventListener\('load'/);
  });
});
