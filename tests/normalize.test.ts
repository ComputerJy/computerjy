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

import { resolveFeaturedImage, PLACEHOLDER_IMAGE } from '../src/lib/normalize';

describe('resolveFeaturedImage', () => {
  it('prefers the real WordPress featured media URL', () => {
    expect(
      resolveFeaturedImage('https://x.com/real.jpg', '<img src="https://x.com/inline.jpg">')
    ).toBe('https://x.com/real.jpg');
  });

  it('falls back to the first inline img when there is no featured media', () => {
    expect(
      resolveFeaturedImage(undefined, '<p>hi</p><img src="https://x.com/inline.jpg"><img src="https://x.com/second.jpg">')
    ).toBe('https://x.com/inline.jpg');
  });

  it('accepts single-quoted src attributes', () => {
    expect(resolveFeaturedImage(undefined, "<img src='https://x.com/q.jpg'>")).toBe('https://x.com/q.jpg');
  });

  it('ignores non-http srcs such as data URIs', () => {
    expect(resolveFeaturedImage(undefined, '<img src="data:image/png;base64,AAAA">')).toBe(PLACEHOLDER_IMAGE);
  });

  it('falls back to the Unsplash placeholder when there is no image at all', () => {
    expect(resolveFeaturedImage(undefined, '<p>no images here</p>')).toBe(PLACEHOLDER_IMAGE);
  });

  it('ignores uppercase IMG tags, matching the case-sensitive Python regex', () => {
    expect(resolveFeaturedImage(undefined, '<IMG SRC="https://x.com/upper.jpg">')).toBe(PLACEHOLDER_IMAGE);
  });
});

import {
  stripTagsForCounting,
  calculateReadingTime,
  resolveExcerpt,
  upgradeContentToHttps,
  upgradeUrlToHttps,
} from '../src/lib/normalize';

describe('stripTagsForCounting', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripTagsForCounting('<p>one</p>\n\n<p>two</p>')).toBe('one two');
  });

  it('strips nested/malformed tags by iterating until stable', () => {
    // Verified against parse_wp_export.py:strip_tags — the iterative pass leaves
    // 'b>' adjacent to 'bold' with no separating space.
    expect(stripTagsForCounting('<<b>b>bold</b>')).toBe('b>bold');
  });

  it('returns empty string for empty input', () => {
    expect(stripTagsForCounting('')).toBe('');
  });
});

describe('calculateReadingTime', () => {
  it('rounds up to whole minutes at 200 wpm', () => {
    expect(calculateReadingTime('<p>' + 'word '.repeat(200) + '</p>')).toBe('1 min read');
    expect(calculateReadingTime('<p>' + 'word '.repeat(201) + '</p>')).toBe('2 min read');
    expect(calculateReadingTime('<p>' + 'word '.repeat(400) + '</p>')).toBe('2 min read');
  });

  it('never returns less than one minute', () => {
    expect(calculateReadingTime('')).toBe('1 min read');
    expect(calculateReadingTime('<p>hi</p>')).toBe('1 min read');
  });
});

describe('resolveExcerpt', () => {
  it('uses the rendered excerpt when present', () => {
    expect(resolveExcerpt('<p>Real excerpt</p>', '<p>body</p>')).toBe('<p>Real excerpt</p>');
  });

  it('falls back to 180 chars of stripped content plus ellipsis', () => {
    const long = 'x'.repeat(300);
    const out = resolveExcerpt('', `<p>${long}</p>`);
    expect(out).toBe('x'.repeat(180) + '...');
  });

  it('does not add an ellipsis when content is short', () => {
    expect(resolveExcerpt('', '<p>short body</p>')).toBe('short body');
  });
});

describe('https upgrades', () => {
  it('upgrades src and href in content, both quote styles', () => {
    expect(upgradeContentToHttps('<img src="http://a/b.jpg"><a href=\'http://c\'>x</a>'))
      .toBe('<img src="https://a/b.jpg"><a href=\'https://c\'>x</a>');
  });

  it('leaves https and protocol-relative URLs alone', () => {
    expect(upgradeContentToHttps('<img src="https://a/b.jpg">')).toBe('<img src="https://a/b.jpg">');
  });

  it('upgrades a bare URL', () => {
    expect(upgradeUrlToHttps('http://a/b.jpg')).toBe('https://a/b.jpg');
    expect(upgradeUrlToHttps(undefined)).toBeUndefined();
  });
});
