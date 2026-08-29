import { describe, it, expect } from 'vitest';
import { sanitizeSlug } from '../src/lib/normalize';

describe('sanitizeSlug', () => {
  it('decodes percent-encoded Arabic slugs to match existing URLs', () => {
    expect(
      sanitizeSlug('%d8%a7%d8%a8%d9%84%d9%8a%d8%b3-%d9%88%d8%a7%d9%84%d8%b9%d8%b1%d8%a8')
    ).toBe('ابليس-والعرب');
  });

  it('keeps the Arabic question mark but strips the ASCII one', () => {
    // %d8%9f is U+061F ARABIC QUESTION MARK - it must survive
    expect(sanitizeSlug('%d9%85%d9%8a%d9%86-%d9%85%d8%b3%d9%84%d9%85%d8%9f')).toBe('مين-مسلم؟');
    expect(sanitizeSlug('what-is-this?')).toBe('what-is-this');
  });

  it('leaves plain ASCII slugs untouched', () => {
    expect(sanitizeSlug('101-greatest-george-carlin-quotes')).toBe('101-greatest-george-carlin-quotes');
  });

  it('strips the characters parse_wp_export.py stripped', () => {
    expect(sanitizeSlug('a?b#c<d>e"f\'g*h:i')).toBe('abcdefghi');
  });

  it('does not throw on malformed percent-encoding', () => {
    expect(sanitizeSlug('100%-broken')).toBe('100%-broken');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeSlug('')).toBe('');
  });
});
