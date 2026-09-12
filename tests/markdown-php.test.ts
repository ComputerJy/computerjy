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

  it('converts strong and emphasis', () => {
    expect(md('<p>Use <strong>bold</strong> and <em>it</em>, <b>b</b> <i>i</i>.</p>')).toBe(
      'Use **bold** and _it_, **b** _i_.'
    );
  });

  it('keeps emphasis markers tight against the text', () => {
    expect(md('<p>a<strong> b </strong>c</p>')).toBe('a **b** c');
  });

  it('does not mistake <br> or <img> for <b> / <i>', () => {
    expect(md('<p>a<br>b <img src="x.png" alt="x"> c</p>')).toBe('a\nb  c');
  });

  it('fences <pre> with and without a nested <code>', () => {
    expect(md('<pre><code>x = 1\ny = 2</code></pre>')).toBe('```\nx = 1\ny = 2\n```');
    expect(md('<pre>x = 1\ny = 2</pre>')).toBe('```\nx = 1\ny = 2\n```');
  });

  it('strips syntax-highlight spans inside code and decodes its entities', () => {
    expect(md('<pre><code><span class="k">if</span> a &lt; b:</code></pre>')).toBe('```\nif a < b:\n```');
    expect(md('<p>Run <code>&lt;div&gt;</code> here</p>')).toBe('Run `<div>` here');
  });

  it('keeps tag-like text in prose as entities instead of re-exposing it as HTML', () => {
    expect(md('<p>Wrap it in &lt;div&gt; tags &amp; go</p>')).toBe('Wrap it in &lt;div&gt; tags & go');
    expect(md('<p>Numeric &#60;b&#x3E; too</p>')).toBe('Numeric &lt;b&gt; too');
  });

  it('unwraps a heading that is entirely bold (block-editor habit)', () => {
    expect(md('<h2><strong>Title</strong></h2>')).toBe('## Title');
    expect(md('<h3>Half <strong>bold</strong></h3>')).toBe('### Half **bold**');
  });

  it('drops source indentation so paragraphs do not become code blocks', () => {
    expect(md('<div>\n    <p>one</p>\n\n    <p>two</p>\n</div>')).toBe('one\n\ntwo');
    expect(md('<pre><code>    indented\n  code</code></pre>')).toBe('```\n    indented\n  code\n```');
  });

  it('keeps code inside links and headings', () => {
    expect(md('<h2>The <code>ls</code> command</h2>')).toBe('## The `ls` command');
    expect(md('<p><a href="/x"><code>ls</code></a></p>')).toBe('[`ls`](/x)');
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
