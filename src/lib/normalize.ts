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
