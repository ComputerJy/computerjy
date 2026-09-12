// The static previews render the real theme.css/theme.js with no WordPress;
// CLAUDE.md asks that they stay in sync with the template markup.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const header = readFileSync('header.php', 'utf8');

describe.each(['preview-home.html', 'preview-single.html'])('%s', (file) => {
  const html = readFileSync(file, 'utf8');

  it.each([
    'search-modal-backdrop',
    'search-modal-input',
    'search-results-list',
    'mobile-drawer-backdrop',
    'mobile-menu-btn',
    'search-trigger-btn',
    'theme-toggle-btn',
  ])('carries the %s hook theme.js binds to', (cls) => {
    expect(header).toContain(cls);
    expect(html).toContain(cls);
  });

  it('shows the recent-posts fallback dates as d/m/Y like the JSON results', () => {
    expect(header).toContain("get_the_date( 'd/m/Y' )");
    expect(html).toMatch(/search-result-snippet">\s*\d{2}\/\d{2}\/\d{4}/);
  });
});
