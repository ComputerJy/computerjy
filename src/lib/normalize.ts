/**
 * Pure normalization helpers reproducing scripts/parse_wp_export.py.
 * These exist to preserve the exact URLs and field values the site already
 * publishes. Behaviour changes here change live URLs - see the spec, section 4.
 */

/**
 * Mirrors parse_wp_export.py:sanitize_slug - URL-decode, then strip the
 * characters that are unsafe for filesystem/URL routing.
 * decodeURIComponent throws on malformed input where Python's unquote does not,
 * so malformed input falls back to the raw string.
 */
export function sanitizeSlug(raw: string): string {
  if (!raw) return '';
  let unquoted: string;
  try {
    unquoted = decodeURIComponent(raw);
  } catch {
    unquoted = raw;
  }
  return unquoted.trim().replace(/[?#<>"'*:]/g, '');
}

/**
 * The exact placeholder parse_wp_export.py used. 354 of 413 posts point at it,
 * so this string is load-bearing for URL/image parity - do not "improve" it.
 */
export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80';

/**
 * Three-tier fallback mirroring parse_wp_export.py:
 *   1. real WordPress featured media
 *   2. first inline <img src="http..."> in the post body
 *   3. hardcoded Unsplash placeholder
 *
 * The regex is deliberately case-sensitive because the Python used re.search
 * with no re.I flag. Matching case-insensitively here would resolve an image
 * for posts that currently show the placeholder, breaking parity.
 */
export function resolveFeaturedImage(
  mediaUrl: string | undefined,
  contentHtml: string
): string {
  if (mediaUrl) return mediaUrl;
  const match = contentHtml.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/);
  if (match) return match[1];
  return PLACEHOLDER_IMAGE;
}

/**
 * Mirrors parse_wp_export.py:strip_tags - repeatedly removes tags until the
 * string stops changing, so nested or malformed markup cannot leave fragments.
 * Distinct from stripHtml() in src/lib/utils.ts, which also decodes entities
 * and is used by the RSS and search-index endpoints. Do not merge them.
 */
export function stripTagsForCounting(html: string): string {
  if (!html) return '';
  let text = html;
  let prev = '';
  while (text !== prev) {
    prev = text;
    text = text.replace(/<[^>]*>/g, ' ');
  }
  return text.replace(/\s+/g, ' ').trim();
}

/** Mirrors parse_wp_export.py:calculate_reading_time - ceil(words / 200), min 1. */
export function calculateReadingTime(html: string): string {
  const text = stripTagsForCounting(html);
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/** Rendered excerpt if present, else 180 chars of stripped content. */
export function resolveExcerpt(renderedExcerpt: string, contentHtml: string): string {
  const trimmed = (renderedExcerpt || '').trim();
  if (trimmed) return trimmed;
  const plain = stripTagsForCounting(contentHtml);
  return plain.length > 180 ? plain.slice(0, 180) + '...' : plain;
}

/** Prevents mixed-content warnings. Preserved from the previous api.ts. */
export function upgradeContentToHttps(html: string): string {
  if (!html || !html.includes('http://')) return html;
  return html
    .replace(/src="http:\/\//g, 'src="https://')
    .replace(/src='http:\/\//g, "src='https://")
    .replace(/href="http:\/\//g, 'href="https://')
    .replace(/href='http:\/\//g, "href='https://");
}

export function upgradeUrlToHttps(url?: string): string | undefined {
  if (!url) return url;
  return url.startsWith('http://') ? url.replace(/^http:\/\//, 'https://') : url;
}

/**
 * Jetpack Photon rewrites <img src> in content.rendered to
 * https://i0.wp.com/<original-host>/<path>?<params>. The published site was built from the raw
 * XML export and uses the original URLs. Photon is measurably worse here: own-domain images come
 * back ~2.4x larger without WebP, and external-host images 302 to HTML instead of serving.
 * Unwrapping restores both parity with the published site and the better asset.
 */
export function unwrapPhotonUrl(url: string): string {
  const match = url.match(/^https?:\/\/i[0-9]\.wp\.com\/(.+)$/);
  if (!match) return url;
  return `https://${match[1].split('?')[0]}`;
}

/**
 * Applies unwrapPhotonUrl to every Photon URL embedded in a block of HTML.
 *
 * The pattern is anchored at the scheme, so `i[0-9].wp.com` must be the host itself:
 * neither `https://evil.com/?x=.wp.com/` nor `https://i0.wp.com.evil.com/` matches.
 * A substring pre-check was removed here deliberately — it read like a host check
 * while being only a fast path, and the anchored pattern is the real test.
 */
export function unwrapPhotonInContent(html: string): string {
  if (!html) return html;
  return html.replace(/https?:\/\/i[0-9]\.wp\.com\/[^"'\s)]+/g, (m) => unwrapPhotonUrl(m));
}

/**
 * The named entities WordPress emits in *.rendered plain-text fields, applied
 * in order with &amp; last - decoding &amp; any earlier would turn a literal
 * "&amp;lt;" into "&lt;" and then (on a later pass) into "<", which is wrong:
 * "&amp;lt;" must decode to the literal string "&lt;".
 */
const NAMED_ENTITIES: Array<[RegExp, string]> = [
  [/&lt;/g, '<'],
  [/&gt;/g, '>'],
  [/&quot;/g, '"'],
  [/&apos;/g, "'"],
  [/&nbsp;/g, ' '],
  [/&hellip;/g, '…'],
  [/&ldquo;/g, '“'],
  [/&rdquo;/g, '”'],
  [/&lsquo;/g, '‘'],
  [/&rsquo;/g, '’'],
  [/&mdash;/g, '—'],
  [/&ndash;/g, '–'],
  [/&amp;/g, '&'],
];

function decodeNumericEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)));
}

/**
 * Decodes the HTML entities the WordPress REST API leaves in *.rendered
 * plain-text fields (title, excerpt, term name/description, comment content).
 * The old XML-export parser yielded decoded text; the REST API does not, and
 * these fields are consumed as plain text (e.g. {post.title.rendered}), so
 * Astro escapes the "&" and the entity would otherwise render literally.
 *
 * Do NOT apply this to content.rendered - post bodies render via set:html
 * and are already correct HTML.
 *
 * Numeric entities are decoded once before the named pass and once after.
 * The second numeric pass is required, not redundant: WordPress can
 * double-encode an ampersand as "&amp;#038;", where the literal "&#038;"
 * numeric entity is only revealed once the leading "&amp;" has been unescaped
 * by the named pass. Collapsing this into a decode-until-stable loop instead
 * would incorrectly re-decode the "&lt;" produced by "&amp;lt;" into "<".
 */
export function decodeEntities(input: string): string {
  if (!input) return '';
  let text = decodeNumericEntities(input);
  for (const [pattern, replacement] of NAMED_ENTITIES) {
    text = text.replace(pattern, replacement);
  }
  return decodeNumericEntities(text);
}

export interface RawWpPost {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  modified: string;
  categories: number[];
  tags: number[];
  featured_media: number;
}
export interface NormalizedComment {
  id: number;
  post_id: number;
  author: string;
  date: string;
  content: string;
  parent: number;
}
export interface Term { name: string; slug: string }
// `type`, not `interface`: an interface has no implicit index signature and
// fails the `Record<string, unknown>` constraint parseData() expects. Do not
// "tidy" this back into an interface - it has broken the build once already.
export type NormalizedPost = {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  modified: string;
  categories: string[];
  tags: string[];
  primaryCategory: Term;
  featuredImageUrl: string;
  readingTime: string;
  comments: NormalizedComment[];
};

/** parse_wp_export.py used this when a post had no categories. */
export const DEFAULT_CATEGORY: Term = { name: 'Tech', slug: 'tech' };

export function normalizePost(
  raw: RawWpPost,
  mediaById: Map<number, string>,
  termsById: Map<number, Term>,
  commentsByPostId: Map<number, NormalizedComment[]>
): NormalizedPost {
  const content = upgradeContentToHttps(unwrapPhotonInContent(raw.content?.rendered ?? ''));

  const categories = raw.categories
    .map((id) => termsById.get(id))
    .filter((t): t is Term => Boolean(t));
  const tags = raw.tags
    .map((id) => termsById.get(id))
    .filter((t): t is Term => Boolean(t));

  const mediaUrl = raw.featured_media
    ? unwrapPhotonUrl(upgradeUrlToHttps(mediaById.get(raw.featured_media)) ?? '') || undefined
    : undefined;

  return {
    id: raw.id,
    slug: sanitizeSlug(raw.slug),
    title: { rendered: decodeEntities(raw.title?.rendered ?? '') },
    // Entities are decoded after resolveExcerpt() has already done any
    // tag-stripping - decoding first could turn an entity-encoded pseudo-tag
    // (e.g. "&lt;script&gt;") into a real one before the stripper sees it.
    excerpt: { rendered: decodeEntities(resolveExcerpt(raw.excerpt?.rendered ?? '', content)) },
    content: { rendered: content },
    date: raw.date,
    modified: raw.modified || raw.date,
    categories: categories.map((c) => c.slug),
    tags: tags.map((t) => t.slug),
    primaryCategory: categories[0] ?? DEFAULT_CATEGORY,
    featuredImageUrl: resolveFeaturedImage(mediaUrl, content),
    readingTime: calculateReadingTime(content),
    comments: (commentsByPostId.get(raw.id) ?? []).map((c) => ({
      ...c,
      content: decodeEntities(c.content),
    })),
  };
}
