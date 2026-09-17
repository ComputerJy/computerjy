import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';

const hasPhp = spawnSync('php', ['-v']).status === 0;

// Stub the one WP function the helper calls so it runs from the CLI.
function words(text: string): number {
  return Number(
    execFileSync(
      'php',
      [
        '-r',
        'define("ABSPATH", "/"); function wp_strip_all_tags($s) { return strip_tags($s); } require "inc/template-tags.php"; echo computerjy2_word_count($argv[1]);',
        text,
      ],
      { encoding: 'utf8' }
    )
  );
}

describe.skipIf(!hasPhp)('computerjy2_word_count', () => {
  it('counts Latin words', () => {
    expect(words('<p>one two  three</p>')).toBe(3);
  });

  it('counts Arabic words (str_word_count returns 0 here)', () => {
    expect(words('<p>هذا نص عربي من ست كلمات</p>')).toBe(6);
  });

  it('returns 0 for empty content', () => {
    expect(words('')).toBe(0);
  });
});
