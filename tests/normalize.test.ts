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

import { unwrapPhotonUrl, unwrapPhotonInContent } from '../src/lib/normalize';

describe('unwrapPhotonUrl', () => {
  it('unwraps an own-domain Photon URL, dropping the query', () => {
    expect(
      unwrapPhotonUrl(
        'https://i0.wp.com/www.computerjy.com/wp-content/uploads/2013/09/MacPC.jpg?resize=590%2C400&ssl=1'
      )
    ).toBe('https://www.computerjy.com/wp-content/uploads/2013/09/MacPC.jpg');
  });

  it('unwraps an external-host Photon URL', () => {
    expect(unwrapPhotonUrl('https://i0.wp.com/1.bp.blogspot.com/x/y.jpeg?w=840'))
      .toBe('https://1.bp.blogspot.com/x/y.jpeg');
  });

  it('leaves a non-Photon URL untouched', () => {
    expect(unwrapPhotonUrl('https://www.computerjy.com/wp-content/uploads/2013/09/MacPC.jpg'))
      .toBe('https://www.computerjy.com/wp-content/uploads/2013/09/MacPC.jpg');
  });
});

describe('unwrapPhotonInContent', () => {
  it('rewrites every occurrence in a string containing two Photon URLs', () => {
    const html =
      '<img src="https://i0.wp.com/a.com/x.jpg?w=840"><img src="https://i0.wp.com/b.com/y.jpg?resize=1%2C2&ssl=1">';
    expect(unwrapPhotonInContent(html)).toBe(
      '<img src="https://a.com/x.jpg"><img src="https://b.com/y.jpg">'
    );
  });

  it('leaves content with no Photon URLs unchanged', () => {
    const html = '<img src="https://www.computerjy.com/wp-content/uploads/2013/09/MacPC.jpg">';
    expect(unwrapPhotonInContent(html)).toBe(html);
  });
});

import { normalizePost, DEFAULT_CATEGORY } from '../src/lib/normalize';
import type { RawWpPost, NormalizedComment } from '../src/lib/normalize';

const raw: RawWpPost = {
  id: 42,
  slug: '%d8%a7%d8%a8%d9%84%d9%8a%d8%b3-%d9%88%d8%a7%d9%84%d8%b9%d8%b1%d8%a8',
  title: { rendered: 'Title' },
  content: { rendered: '<p>' + 'word '.repeat(400) + '</p>' },
  excerpt: { rendered: '<p>Ex</p>' },
  date: '2015-06-11T10:00:00',
  modified: '2016-01-01T10:00:00',
  categories: [7, 9],
  tags: [11],
  featured_media: 0,
};
const terms = new Map([
  [7, { name: 'Geeky', slug: 'g33ky' }],
  [9, { name: 'Fun', slug: 'fun' }],
  [11, { name: 'Humor', slug: 'humor' }],
]);

describe('normalizePost', () => {
  it('uses the decoded slug so existing URLs are preserved', () => {
    expect(normalizePost(raw, new Map(), terms, new Map()).slug).toBe('ابليس-والعرب');
  });

  it('maps category and tag ids to slug strings', () => {
    const p = normalizePost(raw, new Map(), terms, new Map());
    expect(p.categories).toEqual(['g33ky', 'fun']);
    expect(p.tags).toEqual(['humor']);
  });

  it('uses the first category as primaryCategory', () => {
    expect(normalizePost(raw, new Map(), terms, new Map()).primaryCategory)
      .toEqual({ name: 'Geeky', slug: 'g33ky' });
  });

  it('falls back to the Tech default when a post has no categories', () => {
    const p = normalizePost({ ...raw, categories: [] }, new Map(), terms, new Map());
    expect(p.primaryCategory).toEqual(DEFAULT_CATEGORY);
    expect(DEFAULT_CATEGORY).toEqual({ name: 'Tech', slug: 'tech' });
  });

  it('resolves featured media by id when present', () => {
    const media = new Map([[5, 'https://x.com/feat.jpg']]);
    const p = normalizePost({ ...raw, featured_media: 5 }, media, terms, new Map());
    expect(p.featuredImageUrl).toBe('https://x.com/feat.jpg');
  });

  it('computes reading time from the content', () => {
    expect(normalizePost(raw, new Map(), terms, new Map()).readingTime).toBe('2 min read');
  });

  it('attaches comments for its own post id only', () => {
    const c: NormalizedComment = { id: 1, post_id: 42, author: 'A', date: 'd', content: 'c', parent: 0 };
    const other: NormalizedComment = { id: 2, post_id: 99, author: 'B', date: 'd', content: 'c', parent: 0 };
    const byPost = new Map([[42, [c]], [99, [other]]]);
    expect(normalizePost(raw, new Map(), terms, byPost).comments).toEqual([c]);
  });

  it('defaults to an empty comments array', () => {
    expect(normalizePost(raw, new Map(), terms, new Map()).comments).toEqual([]);
  });

  it('upgrades http URLs inside content', () => {
    const p = normalizePost(
      { ...raw, content: { rendered: '<img src="http://a/b.jpg">' } },
      new Map(), terms, new Map()
    );
    expect(p.content.rendered).toBe('<img src="https://a/b.jpg">');
  });
});
