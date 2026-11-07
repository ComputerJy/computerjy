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

// Stubs for one article; $argv[1] is the case as JSON. get_post_datetime()
// mirrors core: 'local' reads post_date in the site zone, 'gmt' reads
// post_date_gmt, and an empty column is false.
const articleStubs = `
define("ABSPATH", "/");
$c = json_decode($argv[1], true);
function c($k) { global $c; return $c[$k] ?? null; }
function add_action() {} function add_filter() {}
function is_front_page() { return false; }
function is_singular() { return !c("archive"); }
function get_post() { return (object) ["ID" => 7, "post_author" => 1]; }
function get_permalink() { return "https://x.test/p/"; }
function get_the_title() { return "Ohio &#038; co"; }
function get_bloginfo($k = "") { return "name" === $k ? "Site" : "en-US"; }
function home_url($p) { return "https://x.test" . $p; }
function has_post_thumbnail() { return (bool) c("thumb"); }
function get_the_post_thumbnail_url() { return c("thumb"); }
function computerjy2_fallback_image_url() { return "https://x.test/placeholder.svg"; }
function computerjy2_primary_category() { return null; }
function get_site_icon_url() { return "https://x.test/icon.webp"; }
function get_theme_mod() { return ""; }
function get_the_excerpt() { return (string) c("excerpt"); }
function get_the_author_meta() { return "Author"; }
function get_author_posts_url() { return "https://x.test/author/"; }
function wp_strip_all_tags($s) { return strip_tags($s); }
function __($s) { return $s; }
function wp_date($f, $t) { return gmdate($f, $t); }
function get_post_datetime($p, $field = "date", $source = "local") {
  $time = (c($field) ?? [])[$source] ?? "";
  if (!$time) { return false; }
  return new DateTimeImmutable($time, new DateTimeZone("gmt" === $source ? "UTC" : "Asia/Amman"));
}
function get_post_timestamp($p, $field = "date") {
  $d = get_post_datetime($p, $field);
  return $d ? $d->getTimestamp() : false;
}
if (c("jetpack")) {
  function jetpack_og_get_image() { return ["src" => c("jetpack")]; }
}
require "inc/seo.php";
`;
const runArticle = (tail: string, input: object = {}) =>
  JSON.parse(
    execFileSync('php', ['-r', articleStubs + tail, JSON.stringify(input)], {
      encoding: 'utf8',
    })
  );
const posting = (input: object = {}) =>
  runArticle('echo json_encode(computerjy2_schema_graph()[0]);', {
    date: { local: '2026-11-06 04:50:14', gmt: '2026-11-06 01:50:14' },
    modified: { local: '2026-11-06 04:50:14', gmt: '2026-11-06 01:50:14' },
    ...input,
  });

describe.skipIf(!hasPhp)('BlogPosting dates', () => {
  // Written at +02:00 in 2013; Amman's zone rules say +03:00 for that date.
  const old = { local: '2013-01-20 15:22:12', gmt: '2013-01-20 13:22:12' };

  it('takes datePublished from the stored GMT time', () => {
    expect(posting({ date: old, modified: old }).datePublished).toBe(
      '2013-01-20T13:22:12+00:00'
    );
  });

  it('takes dateModified from the stored GMT time', () => {
    expect(posting({ date: old, modified: old }).dateModified).toBe(
      '2013-01-20T13:22:12+00:00'
    );
  });

  it('falls back to the local date on a draft with no GMT date', () => {
    const draft = { local: '2013-01-20 15:22:12', gmt: '' };
    expect(posting({ date: draft, modified: draft }).datePublished).toBe(
      '2013-01-20T12:22:12+00:00'
    );
  });

  it('never puts dateModified before datePublished', () => {
    const scheduled = {
      date: { local: '2026-11-02 14:27:00', gmt: '2026-11-02 11:27:00' },
      modified: { local: '2026-11-02 02:34:46', gmt: '2026-11-01 23:34:46' },
    };
    expect(posting(scheduled).dateModified).toBe('2026-11-02T11:27:00+00:00');
  });
});

describe.skipIf(!hasPhp)('BlogPosting image', () => {
  it('prefers the featured image', () => {
    const image = posting({
      thumb: 'https://x.test/featured.webp',
      jetpack: 'https://x.test/body.webp',
    }).image;
    expect(image).toBe('https://x.test/featured.webp');
  });

  it("uses Jetpack's body image when there is no featured image", () => {
    expect(posting({ jetpack: 'https://x.test/body.webp' }).image).toBe(
      'https://x.test/body.webp'
    );
  });

  it('keeps the fallback image over the site icon', () => {
    expect(posting({ jetpack: 'https://x.test/icon.webp' }).image).toBe(
      'https://x.test/placeholder.svg'
    );
  });

  it('keeps the fallback image without Jetpack', () => {
    expect(posting().image).toBe('https://x.test/placeholder.svg');
  });
});

describe.skipIf(!hasPhp)('descriptions for posts with no text', () => {
  const fallback = 'Ohio & co: a post from Site';

  it('keeps a real excerpt in BlogPosting', () => {
    expect(posting({ excerpt: 'Real text' }).description).toBe('Real text');
  });

  it('gives BlogPosting the fallback when the excerpt is empty', () => {
    expect(posting().description).toBe(fallback);
  });

  it("replaces Jetpack's default og:description on a post", () => {
    const tail =
      'echo json_encode(computerjy2_og_fallback_description("Visit the post for more."));';
    expect(runArticle(tail)).toBe(fallback);
  });

  it("leaves Jetpack's default alone off a post", () => {
    const tail =
      'echo json_encode(computerjy2_og_fallback_description("Visit the post for more."));';
    expect(runArticle(tail, { archive: true })).toBe(
      'Visit the post for more.'
    );
  });

  it('fills an empty meta description on a post', () => {
    const tail = 'echo json_encode(computerjy2_seo_meta_tags([]));';
    expect(runArticle(tail).description).toBe(fallback);
  });

  it('keeps an existing meta description', () => {
    const tail =
      'echo json_encode(computerjy2_seo_meta_tags(["description" => "Mine"]));';
    expect(runArticle(tail).description).toBe('Mine');
  });

  it('adds no meta description off a post', () => {
    const tail = 'echo json_encode(computerjy2_seo_meta_tags([]));';
    expect(runArticle(tail, { archive: true })).toEqual([]);
  });
});

describe.skipIf(!hasPhp)('computerjy2_og_modified_time', () => {
  const tags = (modified: string) =>
    runArticle(
      `echo json_encode(computerjy2_og_modified_time([
        "article:published_time" => "2026-11-02T11:27:00+00:00",
        "article:modified_time" => "${modified}",
      ]));`
    )['article:modified_time'];

  it('lifts a modified time that precedes publication', () => {
    expect(tags('2026-11-01T23:34:46+00:00')).toBe('2026-11-02T11:27:00+00:00');
  });

  it('keeps a modified time after publication', () => {
    expect(tags('2026-11-03T08:00:00+00:00')).toBe('2026-11-03T08:00:00+00:00');
  });
});
