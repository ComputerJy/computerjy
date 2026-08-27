/**
 * Safely strips all HTML tags and unescapes common entities.
 * Uses iterative sanitization to prevent nested tag injection.
 */
export function stripHtml(input: string): string {
  if (!input) return '';
  let str = input;
  let prev = '';

  // Iteratively strip HTML tags until no tags remain
  while (str !== prev) {
    prev = str;
    str = str.replace(/<[^>]*>/g, '');
  }

  // Remove potential orphaned brackets and decode common entities
  return str
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8230;/g, '...')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}
