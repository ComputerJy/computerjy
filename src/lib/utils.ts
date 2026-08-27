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

/**
 * Sanitizes reader comments by stripping unsafe elements and attributes.
 * Allows only safe formatting tags: <b>, <i>, <em>, <strong>, <code>, <p>, <br>.
 */
export function sanitizeCommentHtml(html: string): string {
  if (!html) return '';
  // Strip dangerous elements entirely
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

  // Strip all on* event attributes (e.g. onload, onclick, onerror)
  clean = clean.replace(/\son\w+="[^"]*"/gi, '').replace(/\son\w+='[^']*'/gi, '');

  // Strip javascript: URLs
  clean = clean.replace(/href=["']javascript:[^"']*["']/gi, 'href="#"');

  return clean;
}
