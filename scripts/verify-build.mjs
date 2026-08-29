#!/usr/bin/env node
/**
 * Verifies a built `dist/` against three independent layers.
 *
 * The migration to the live WordPress REST API means upstream can change the rendered
 * site with no commit here. Three regressions proved that during the migration itself:
 * Jetpack Photon rewrote 748 image URLs, `.rendered` fields introduced 11,027
 * double-escaped entities, and a filter bug left 32 tag pages serving identical filler.
 * Unit tests, `astro check` and a green build all passed through every one of them.
 *
 *   Layer 1  invariants        no external dependency, never goes stale
 *   Layer 2  live-API checks   self-updating; no fixture to maintain
 *   Layer 3  slug fixture      append-only; a published URL may never silently vanish
 *
 * Usage:  node scripts/verify-build.mjs [--update]
 *   --update  rewrite the slug fixture from the current build (deliberate act:
 *             use it only when a post was intentionally deleted or renamed)
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** Overridable so the checks can be mutation-tested against a copied build. */
const DIST = process.env.VERIFY_DIST ?? 'dist';
const SLUG_FIXTURE = 'scripts/known-slugs.json';
const API_BASE = 'https://www.computerjy.com/wp-json/wp/v2';

/** Sidebar.astro renders trendingPosts.slice(0, 4), so a page may carry up to 4 extra links. */
const SIDEBAR_MAX = 4;

// ---------------------------------------------------------------------------
// Pure helpers - unit tested in tests/verify-build.test.ts
// ---------------------------------------------------------------------------

/**
 * All matches of a forbidden pattern. Resets `lastIndex` so a global regex can be
 * reused across calls without silently skipping matches on every second call.
 */
export function findForbiddenMatches(text, regex) {
  regex.lastIndex = 0;
  return [...text.matchAll(regex)].map((m) => m[0]);
}

/** Directory names still carrying percent-encoding - the Arabic-slug regression. */
export function percentEncodedSlugs(names) {
  return names.filter((n) => /%[0-9a-fA-F]{2}/.test(n));
}

/**
 * A page must contain every post the API assigns to the term. Extra links are the
 * sidebar's trending posts, tolerated up to `sidebarMax`; a missing post is never
 * tolerated, because that is the direction every real regression took.
 */
export function comparePostSets(expected, actual, sidebarMax) {
  const missing = expected.filter((s) => !actual.has(s));
  const extra = [...actual].filter((s) => !expected.includes(s));
  return {
    missing,
    extra,
    ok: missing.length === 0 && extra.length <= sidebarMax,
  };
}

/** Known slugs must still resolve. New slugs are reported, never a failure. */
export function diffKnownSlugs(known, built) {
  const missing = known.filter((s) => !built.has(s));
  const added = [...built].filter((s) => !known.includes(s));
  return { missing, added, ok: missing.length === 0 };
}

// ---------------------------------------------------------------------------
// I/O
// ---------------------------------------------------------------------------

let failures = 0;
const fail = (msg) => {
  console.error(`FAIL ${msg}`);
  failures++;
};
const pass = (msg) => console.log(`ok   ${msg}`);

function htmlFiles(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, acc);
    else if (e.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

function postLinks(html) {
  return new Set(
    [...html.matchAll(/href="\/posts\/([^"]+)"/g)]
      .map((m) => m[1])
      .filter((s) => !s.includes('${'))
  );
}

async function apiJson(path) {
  // Mirrors src/lib/wp-client.ts: if Cloudflare bot protection is ever re-enabled,
  // this header plus a matching WAF skip rule is what keeps CI able to reach the API.
  const token = process.env.WP_BUILD_TOKEN;
  const init = token ? { headers: { 'X-Build-Auth': token } } : undefined;
  const res = await fetch(`${API_BASE}/${path}`, init);
  if (!res.ok) {
    const edge = ['cf-mitigated', 'cf-ray']
      .map((h) => [h, res.headers.get(h)])
      .filter(([, v]) => v)
      .map(([h, v]) => `${h}=${v}`)
      .join(', ');
    throw new Error(
      `GET ${API_BASE}/${path} returned ${res.status}${edge ? ` [${edge}]` : ''}`
    );
  }
  return {
    body: await res.json(),
    total: Number(res.headers.get('X-WP-Total') ?? '0'),
  };
}

// ---------------------------------------------------------------------------
// Layer 1 - invariants
// ---------------------------------------------------------------------------

function layer1(files) {
  const checks = [
    ['Jetpack Photon URLs', /https?:\/\/i[0-9]\.wp\.com\//g],
    [
      'double-encoded HTML entities',
      /&amp;(#\d+|#x[0-9a-fA-F]+|hellip|nbsp|amp|lt|gt|quot);/g,
    ],
  ];
  for (const [label, pattern] of checks) {
    const offenders = [];
    for (const f of files) {
      const hits = findForbiddenMatches(readFileSync(f, 'utf8'), pattern);
      if (hits.length)
        offenders.push(`${f} (${hits.length}x, e.g. ${hits[0]})`);
    }
    if (offenders.length) {
      fail(`${label}: found in ${offenders.length} file(s)`);
      offenders.slice(0, 5).forEach((o) => console.error(`   ${o}`));
    } else {
      pass(`no ${label} in ${files.length} built pages`);
    }
  }

  const slugDirs = readdirSync(join(DIST, 'posts'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const encoded = percentEncodedSlugs(slugDirs);
  if (encoded.length) {
    fail(
      `percent-encoded post slugs: ${encoded.length} (live URLs would change)`
    );
    encoded.slice(0, 5).forEach((s) => console.error(`   ${s}`));
  } else {
    pass(`no percent-encoded slugs across ${slugDirs.length} posts`);
  }

  if (existsSync(join(DIST, 'data', 'posts.json')))
    fail('dist/data/posts.json is being shipped again');
  else pass('bulk content dump not shipped');

  const rss = readFileSync(join(DIST, 'rss.xml'), 'utf8');
  const itemCount = (rss.match(/<item>/g) ?? []).length;
  if (itemCount < 1) fail('rss.xml has no items');
  else pass(`rss.xml has ${itemCount} items`);

  const idx = JSON.parse(readFileSync(join(DIST, 'search-index.json'), 'utf8'));
  if (!Array.isArray(idx) || idx.length === 0)
    fail('search-index.json is empty');
  else pass(`search-index.json has ${idx.length} entries`);

  return slugDirs;
}

// ---------------------------------------------------------------------------
// Layer 2 - live-API cross-checks
// ---------------------------------------------------------------------------

async function layer2(slugDirs) {
  const { total: postTotal } = await apiJson('posts?per_page=1&_fields=id');
  if (slugDirs.length !== postTotal) {
    fail(
      `built ${slugDirs.length} post pages but the API reports ${postTotal}`
    );
  } else {
    pass(`post count matches the API (${postTotal})`);
  }

  const bySlug = new Map();
  for (let page = 1; ; page++) {
    const { body } = await apiJson(
      `posts?per_page=100&page=${page}&_fields=slug,categories,tags`
    );
    if (!body.length) break;
    for (const p of body) bySlug.set(decodeURIComponent(p.slug), p);
    if (body.length < 100) break;
  }

  for (const taxonomy of ['categories', 'tags']) {
    const { body: terms } = await apiJson(
      `${taxonomy}?per_page=100&_fields=id,slug,count`
    );
    const dir = taxonomy === 'categories' ? 'category' : 'tag';
    let bad = 0;
    for (const term of terms.filter((t) => t.count > 0)) {
      const file = join(DIST, dir, term.slug, 'index.html');
      if (!existsSync(file)) {
        fail(
          `${dir}/${term.slug}: page missing (API reports ${term.count} posts)`
        );
        bad++;
        continue;
      }
      const expected = [...bySlug.entries()]
        .filter(([, p]) => p[taxonomy].includes(term.id))
        .map(([slug]) => slug);
      const r = comparePostSets(
        expected,
        postLinks(readFileSync(file, 'utf8')),
        SIDEBAR_MAX
      );
      if (!r.ok) {
        fail(
          `${dir}/${term.slug}: ${r.missing.length} of ${expected.length} expected posts missing` +
            (r.extra.length > SIDEBAR_MAX
              ? `, ${r.extra.length} unexpected`
              : '')
        );
        r.missing.slice(0, 3).forEach((s) => console.error(`   missing: ${s}`));
        bad++;
      }
    }
    if (bad === 0)
      pass(
        `${taxonomy}: every page contains exactly the posts the API assigns`
      );
  }
}

// ---------------------------------------------------------------------------
// Layer 3 - slug fixture
// ---------------------------------------------------------------------------

function layer3(slugDirs, update) {
  const built = new Set(slugDirs);
  if (update || !existsSync(SLUG_FIXTURE)) {
    writeFileSync(
      SLUG_FIXTURE,
      JSON.stringify([...built].sort(), null, 2) + '\n'
    );
    pass(`slug fixture written with ${built.size} slugs`);
    return;
  }
  const known = JSON.parse(readFileSync(SLUG_FIXTURE, 'utf8'));
  const r = diffKnownSlugs(known, built);
  if (!r.ok) {
    fail(`${r.missing.length} previously published slug(s) no longer build`);
    r.missing.slice(0, 5).forEach((s) => console.error(`   missing: ${s}`));
    console.error(
      '   If a post was deliberately removed: npm run verify:build -- --update'
    );
  } else {
    pass(
      `all ${known.length} known slugs still build` +
        (r.added.length ? `, ${r.added.length} new` : '')
    );
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const update = process.argv.includes('--update');
  const files = htmlFiles(DIST);
  const slugDirs = layer1(files);
  await layer2(slugDirs);
  layer3(slugDirs, update);
  console.log(
    failures === 0
      ? '\nBUILD VERIFIED'
      : `\nBUILD VERIFICATION FAILED (${failures})`
  );
  process.exit(failures === 0 ? 0 : 1);
}

if (process.argv[1] && process.argv[1].endsWith('verify-build.mjs')) {
  main().catch((e) => {
    console.error(`FAIL verification could not complete: ${e.message}`);
    process.exit(1);
  });
}
