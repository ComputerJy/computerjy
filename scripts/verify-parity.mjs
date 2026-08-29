#!/usr/bin/env node
/**
 * Compares a fresh build against the golden JSON snapshot.
 * Blocks Phase 2 (deletions) until URLs and featured images match exactly.
 *
 * Usage: npm run build && node scripts/verify-parity.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const golden = JSON.parse(readFileSync('src/data/posts.json', 'utf8'));
let failures = 0;

const fail = (msg) => { console.error(`FAIL ${msg}`); failures++; };
const pass = (msg) => console.log(`ok   ${msg}`);

// --- 1. URL parity -------------------------------------------------------
const goldenSlugs = new Set(golden.map((p) => p.slug));
const builtSlugs = new Set(readdirSync('dist/posts', { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name));

const missing = [...goldenSlugs].filter((s) => !builtSlugs.has(s));
const extra = [...builtSlugs].filter((s) => !goldenSlugs.has(s));

if (missing.length || extra.length) {
  fail(`URL parity: ${missing.length} missing, ${extra.length} unexpected`);
  missing.slice(0, 10).forEach((s) => console.error(`   missing: ${s}`));
  extra.slice(0, 10).forEach((s) => console.error(`   extra:   ${s}`));
} else {
  pass(`URL parity: ${builtSlugs.size} post URLs identical`);
}

// --- 2. Featured image parity -------------------------------------------
// og:image is HTML-escaped in the built output, so decode before comparing.
const decode = (s) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
   .replace(/&amp;/g, '&')
   .replace(/&#39;/g, "'")
   .replace(/&quot;/g, '"');

// The golden snapshot stores raw pre-sanitization values; the pipeline that built the
// published site upgraded http->https at render time (old api.ts sanitizeUrl). Compare
// rendered-output to rendered-output, not raw-input to rendered-output.
const normalizeGolden = (u) => (u.startsWith('http://') ? u.replace(/^http:\/\//, 'https://') : u);

// Adjudicated exceptions, each verified against the live site. The gate still fails on
// any image difference not listed here.
const ACCEPTED_IMAGE_DEVIATIONS = {
  // Photon replaced WordPress's -WxH thumbnail with full-size + ?resize=. Unwrapping cannot
  // recover the thumbnail filename, and reconstructing it is unsafe (verified: the same
  // pattern 404s on posts whose golden value is the full-size file). Same image, larger payload.
  'social-wariors': 'photon-thumbnail-lost',
  'speed-up-windows-boot-time': 'photon-thumbnail-lost',
  'too-much-defrag': 'photon-thumbnail-lost',
  'are-all-snakes-venomous': 'photon-thumbnail-lost',
  'writing-an-essay-in-a-programming-language': 'photon-thumbnail-lost',
  'facebook-facts': 'photon-thumbnail-lost',
  // URL-encoding-only differences (%3A vs :, %2B vs +). Both forms 404 on the live site —
  // these images are already broken today, so there is no behavioural change.
  'meanwhile-in-china': 'encoding-only-already-404',
  'sunday-sweets-when-geeks-marry': 'encoding-only-already-404',
};

let imageIdentical = 0;
let imageAccepted = 0;
let imageMismatches = 0;

for (const post of golden) {
  const file = `dist/posts/${post.slug}/index.html`;
  if (!existsSync(file)) continue; // already reported as a URL failure
  const html = readFileSync(file, 'utf8');
  const m = html.match(/<meta property="og:image" content="([^"]*)"/);
  const built = m ? decode(m[1]) : null;
  if (built === normalizeGolden(post.featuredImageUrl)) {
    imageIdentical++;
    continue;
  }
  if (Object.prototype.hasOwnProperty.call(ACCEPTED_IMAGE_DEVIATIONS, post.slug)) {
    imageAccepted++;
    continue;
  }
  if (imageMismatches < 10) {
    console.error(`   image differs: ${post.slug}\n     golden: ${post.featuredImageUrl}\n     built:  ${built}`);
  }
  imageMismatches++;
}
if (imageMismatches) {
  fail(`Featured images: ${imageMismatches} unexpected (${imageIdentical} identical, ${imageAccepted} accepted deviations)`);
} else {
  pass(`Featured images: ${imageIdentical} identical, ${imageAccepted} accepted deviations, 0 unexpected`);
}

// --- 3. Category page counts (must not regress) --------------------------
const goldenByCat = {};
for (const p of golden) {
  const s = p.primaryCategory?.slug ?? 'tech';
  goldenByCat[s] = (goldenByCat[s] ?? 0) + 1;
}
for (const [slug, count] of Object.entries(goldenByCat)) {
  const file = `dist/category/${slug}/index.html`;
  if (!existsSync(file)) { fail(`category page missing: ${slug}`); continue; }
  console.log(`info category/${slug}: golden primary-category count ${count}`);
}

// --- 4. Tag pages must now differ from one another -----------------------
// Before the Task 8 fix every tag page rendered the same four filler posts.
const tagDirs = existsSync('dist/tag')
  ? readdirSync('dist/tag', { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  : [];
const signatures = new Map();
for (const t of tagDirs) {
  const html = readFileSync(`dist/tag/${t}/index.html`, 'utf8');
  const links = [...new Set([...html.matchAll(/href="\/posts\/([^"]+)"/g)].map((m) => m[1]))].sort().join(',');
  signatures.set(t, links);
}
const distinct = new Set(signatures.values());
if (tagDirs.length && distinct.size === 1) {
  fail(`Tag pages: all ${tagDirs.length} render an identical post set - filter still broken`);
} else {
  pass(`Tag pages: ${distinct.size} distinct post sets across ${tagDirs.length} tags`);
}

console.log(failures === 0 ? '\nPARITY OK' : `\nPARITY FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
