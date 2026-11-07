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

// Runs a PHP expression with inc/template-tags.php loaded and WP stubbed.
function php(expr: string, ...args: string[]): string {
  const stubs = `define("ABSPATH", "/");
    function get_bloginfo($k) { return $GLOBALS["argv"][1]; }
    function apply_filters($hook, $value) { return $value; }
    function esc_html($s) { return $s; }
    require "inc/template-tags.php";`;
  return execFileSync('php', ['-r', `${stubs} echo ${expr};`, ...args], {
    encoding: 'utf8',
  });
}

describe.skipIf(!hasPhp)('computerjy2_brand_mark', () => {
  const mark = (name: string) => php('computerjy2_brand_mark()', name);

  it('accents Jy wherever it sits in the site name', () => {
    expect(mark('ComputerJy World')).toBe(
      'Computer<span class="brand-accent">Jy</span> World'
    );
    expect(mark('ComputerJy')).toBe(
      'Computer<span class="brand-accent">Jy</span>'
    );
  });

  it('leaves a name without Jy alone', () => {
    expect(mark('Other Site')).toBe('Other Site');
  });
});

describe.skipIf(!hasPhp)('computerjy2_pick_card_tags', () => {
  const pick = (counts: Record<string, number>) =>
    JSON.parse(
      php(
        `json_encode(array_map(fn($t) => $t->name, computerjy2_pick_card_tags(array_map(fn($n, $c) => (object) ["name" => $n, "count" => $c], array_keys(json_decode($argv[1], true)), json_decode($argv[1], true)))))`,
        JSON.stringify(counts)
      )
    );

  it('keeps the three rarest tags, rarest first', () => {
    expect(
      pick({ Computers: 124, Android: 8, Google: 23, Mobile: 6, News: 22 })
    ).toEqual(['Mobile', 'Android', 'News']);
  });

  it('returns what there is when a post has few tags', () => {
    expect(pick({ AI: 16 })).toEqual(['AI']);
    expect(pick({})).toEqual([]);
  });
});

describe.skipIf(!hasPhp)('computerjy2_post_link_targets', () => {
  const targets = () =>
    JSON.parse(
      php(
        'json_encode(computerjy2_post_link_targets("https://x.test/a b/", "T & U"))',
        ''
      )
    ) as Record<string, { label: string; href: string }>;

  it('covers every network the article offers', () => {
    expect(Object.keys(targets())).toEqual([
      'x',
      'facebook',
      'linkedin',
      'reddit',
      'whatsapp',
      'telegram',
      'email',
    ]);
  });

  it('puts the encoded address in every link', () => {
    for (const { href } of Object.values(targets()))
      expect(href).toContain('https%3A%2F%2Fx.test%2Fa%20b%2F');
  });
});
