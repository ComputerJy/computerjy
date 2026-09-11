import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';

const hasPhp = spawnSync('php', ['-v']).status === 0;

function md(html: string): string {
  return execFileSync(
    'php',
    ['-r', 'require "public/markdown.php"; echo computerjy_html_to_markdown($argv[1]);', html],
    { encoding: 'utf8' }
  );
}

describe.skipIf(!hasPhp)('public/markdown.php converter', () => {
  it('is loadable from the CLI without WordPress', () => {
    expect(() => md('')).not.toThrow();
  });

  it('converts headings, links, code and paragraphs', () => {
    const out = md('<h2>Title</h2><p>See <a href="/posts/x">this</a> and <code>ls</code>.</p>');
    expect(out).toContain('## Title');
    expect(out).toContain('[this](/posts/x)');
    expect(out).toContain('`ls`');
  });

  it('decodes entities and strips leftover tags', () => {
    expect(md('<p>Tom &amp; Jerry <span>ok</span></p>')).toBe('Tom & Jerry ok');
  });

  it('collapses runs of blank lines', () => {
    expect(md('<p>a</p><p>b</p>')).toBe('a\n\nb');
  });
});
