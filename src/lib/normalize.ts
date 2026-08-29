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
