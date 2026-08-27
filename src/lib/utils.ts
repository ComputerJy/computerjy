/**
 * HTML Escaping & Sanitization Utilities
 */

/**
 * Escapes HTML special characters to prevent XSS vulnerabilities.
 */
export function escapeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safely strips all HTML tags and decodes common entities to produce clean plain text.
 */
export function stripHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8230;/g, '...')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitizes reader comments using an escape-first whitelist approach.
 * Completely escapes all raw HTML to neutralize malicious tags and attributes,
 * then selectively restores only strictly attribute-less safe formatting tags.
 */
export function sanitizeCommentHtml(html: string): string {
  if (!html) return '';
  
  // Step 1: Escape all HTML characters
  const escaped = escapeHtml(html);

  // Step 2: Restore strictly safe, attribute-free formatting tags
  return escaped
    .replace(/&lt;b&gt;/gi, '<b>')
    .replace(/&lt;\/b&gt;/gi, '</b>')
    .replace(/&lt;strong&gt;/gi, '<strong>')
    .replace(/&lt;\/strong&gt;/gi, '</strong>')
    .replace(/&lt;i&gt;/gi, '<i>')
    .replace(/&lt;\/i&gt;/gi, '</i>')
    .replace(/&lt;em&gt;/gi, '<em>')
    .replace(/&lt;\/em&gt;/gi, '</em>')
    .replace(/&lt;code&gt;/gi, '<code>')
    .replace(/&lt;\/code&gt;/gi, '</code>')
    .replace(/&lt;p&gt;/gi, '<p>')
    .replace(/&lt;\/p&gt;/gi, '</p>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br />')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br />');
}
