import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';

const hasPhp = spawnSync('php', ['-v']).status === 0;

// Stubs: one published post, "1goal", at /2010/07/1goal/.
const stubs = `
define("ABSPATH", "/"); define("OBJECT", "OBJECT");
function add_action() {} function add_filter() {}
function home_url($p) { return "https://x.test" . $p; }
function get_page_by_path($slug) {
  return "1goal" === $slug ? (object) ["post_status" => "publish"] : null;
}
function get_permalink() { return "https://x.test/2010/07/1goal/"; }
require "inc/seo.php";
echo computerjy2_legacy_target($argv[1]);
`;
const target = (request: string) =>
  execFileSync('php', ['-r', stubs, request], { encoding: 'utf8' });

describe.skipIf(!hasPhp)('computerjy2_legacy_target', () => {
  it.each(['posts/1goal', '2008/01/1goal', '2008/01/15/1goal'])(
    '%s → the post',
    (req) => {
      expect(target(req)).toBe('https://x.test/2010/07/1goal/');
    }
  );

  it('strips the old /posts front from archive URLs', () => {
    expect(target('posts/author/computerjy')).toBe(
      'https://x.test/author/computerjy/'
    );
  });

  it.each(['posts/1go', 'posts/nope', '2008/01/15', 'category/linux'])(
    'leaves %s a 404 (exact slugs only)',
    (req) => {
      expect(target(req)).toBe('');
    }
  );
});

describe.skipIf(!hasPhp)('computerjy2_thumbnail_alt', () => {
  const thumb = (html: string) =>
    execFileSync(
      'php',
      [
        '-r',
        `define("ABSPATH", "/");
        function add_action() {} function add_filter() {}
        function get_the_title($id) { return 7 === $id ? "Rust &#038; <em>apps</em>" : "wrong post"; }
        function wp_strip_all_tags($s) { return strip_tags($s); }
        function esc_attr($s) { return htmlspecialchars($s, ENT_QUOTES); }
        require "inc/seo.php";
        echo computerjy2_thumbnail_alt($argv[1], 7);`,
        html,
      ],
      { encoding: 'utf8' }
    );

  it('falls back to the post title when the library alt is empty', () => {
    expect(thumb('<img src="a.webp" alt="" />')).toBe(
      '<img src="a.webp" alt="Rust &amp; apps" />'
    );
  });

  it('keeps a media-library alt', () => {
    const img = '<img src="a.webp" alt="Two phones" />';
    expect(thumb(img)).toBe(img);
  });
});
