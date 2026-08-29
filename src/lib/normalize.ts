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
