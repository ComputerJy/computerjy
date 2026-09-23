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
