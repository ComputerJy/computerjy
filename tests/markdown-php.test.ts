import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';

const hasPhp = spawnSync('php', ['-v']).status === 0;

function md(html: string): string {
  return execFileSync(
    'php',
    [
      '-r',
      'require "public/markdown.php"; echo computerjy_html_to_markdown($argv[1]);',
      html,
    ],
    { encoding: 'utf8' }
  );
}

function tokens(text: string): string {
  return execFileSync(
    'php',
    [
      '-r',
      'require "public/markdown.php"; echo computerjy_markdown_token_estimate($argv[1]);',
      text,
    ],
    { encoding: 'utf8' }
  );
}

describe.skipIf(!hasPhp)('public/markdown.php converter', () => {
  it('is loadable from the CLI without WordPress', () => {
    expect(() => md('')).not.toThrow();
  });

  it('converts headings, links, code and paragraphs', () => {
    const out = md(
      '<h2>Title</h2><p>See <a href="/posts/x">this</a> and <code>ls</code>.</p>'
    );
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

  it('strips embedded script and style tags before conversion', () => {
    expect(md('<p>a</p><script>alert(1)</script><p>b</p>')).toBe('a\n\nb');
  });

  it('estimates tokens for Latin text', () => {
    expect(tokens('one two three')).toBe('4');
  });

  it('estimates tokens for Arabic text (unicode-aware, unlike str_word_count)', () => {
    expect(tokens('هذا نص عربي بسيط')).toBe('6');
  });

  it('estimates zero tokens for empty input', () => {
    expect(tokens('')).toBe('0');
  });
});
