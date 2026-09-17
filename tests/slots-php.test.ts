import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';

const hasPhp = spawnSync('php', ['-v']).status === 0;

// inc/slots.php registers a filter at load time; stub the one WP function it
// calls so the pure helper can run from the CLI.
function insert(html: string, after: number, slot = '<!--slot-->'): string {
  return execFileSync(
    'php',
    [
      '-r',
      'define("ABSPATH", "/"); function add_filter() {} require "inc/slots.php"; echo computerjy2_insert_after_paragraph($argv[1], (int) $argv[2], $argv[3]);',
      html,
      String(after),
      slot,
    ],
    { encoding: 'utf8' }
  );
}

describe.skipIf(!hasPhp)('computerjy2_insert_after_paragraph', () => {
  it('inserts after the Nth paragraph', () => {
    expect(insert('<p>a</p><p>b</p><p>c</p>', 2)).toBe(
      '<p>a</p><p>b</p><!--slot--><p>c</p>'
    );
  });

  it('leaves trailing non-paragraph content untouched (no stray </p>)', () => {
    const html = '<p>a</p>\n<p>b</p>\n<ul><li>tail</li></ul>';
    expect(insert(html, 1)).toBe(
      '<p>a</p><!--slot-->\n<p>b</p>\n<ul><li>tail</li></ul>'
    );
  });

  it('does not insert when the post is too short', () => {
    const html = '<p>a</p><p>b</p><figure>x</figure>';
    expect(insert(html, 2)).toBe(html);
    expect(insert(html, 5)).toBe(html);
  });

  it('clamps N to at least 1 instead of disabling', () => {
    expect(insert('<p>a</p><p>b</p>', 0)).toBe('<p>a</p><!--slot--><p>b</p>');
  });

  it('matches </P> case-insensitively', () => {
    expect(insert('<P>a</P><P>b</P>', 1)).toBe('<P>a</P><!--slot--><P>b</P>');
  });
});
