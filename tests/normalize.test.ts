import { describe, it, expect } from 'vitest';
import { sanitizeSlug } from '../src/lib/normalize';

describe('sanitizeSlug', () => {
  it('decodes percent-encoded Arabic slugs to match existing URLs', () => {
    expect(
      sanitizeSlug(
        '%d8%a7%d8%a8%d9%84%d9%8a%d8%b3-%d9%88%d8%a7%d9%84%d8%b9%d8%b1%d8%a8'
      )
    ).toBe('ابليس-والعرب');
  });

  it('keeps the Arabic question mark but strips the ASCII one', () => {
    // %d8%9f is U+061F ARABIC QUESTION MARK - it must survive
    expect(
      sanitizeSlug('%d9%85%d9%8a%d9%86-%d9%85%d8%b3%d9%84%d9%85%d8%9f')
    ).toBe('مين-مسلم؟');
    expect(sanitizeSlug('what-is-this?')).toBe('what-is-this');
  });

  it('leaves plain ASCII slugs untouched', () => {
    expect(sanitizeSlug('101-greatest-george-carlin-quotes')).toBe(
      '101-greatest-george-carlin-quotes'
    );
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
      resolveFeaturedImage(
        'https://x.com/real.jpg',
        '<img src="https://x.com/inline.jpg">'
      )
    ).toBe('https://x.com/real.jpg');
  });

  it('falls back to the first inline img when there is no featured media', () => {
    expect(
      resolveFeaturedImage(
        undefined,
        '<p>hi</p><img src="https://x.com/inline.jpg"><img src="https://x.com/second.jpg">'
      )
    ).toBe('https://x.com/inline.jpg');
  });

  it('accepts single-quoted src attributes', () => {
    expect(
      resolveFeaturedImage(undefined, "<img src='https://x.com/q.jpg'>")
    ).toBe('https://x.com/q.jpg');
  });

  it('ignores non-http srcs such as data URIs', () => {
    expect(
      resolveFeaturedImage(undefined, '<img src="data:image/png;base64,AAAA">')
    ).toBe(PLACEHOLDER_IMAGE);
  });

  it('falls back to the Unsplash placeholder when there is no image at all', () => {
    expect(resolveFeaturedImage(undefined, '<p>no images here</p>')).toBe(
      PLACEHOLDER_IMAGE
    );
  });

  it('ignores uppercase IMG tags, matching the case-sensitive Python regex', () => {
    expect(
      resolveFeaturedImage(undefined, '<IMG SRC="https://x.com/upper.jpg">')
    ).toBe(PLACEHOLDER_IMAGE);
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
    expect(calculateReadingTime('<p>' + 'word '.repeat(200) + '</p>')).toBe(
      '1 min read'
    );
    expect(calculateReadingTime('<p>' + 'word '.repeat(201) + '</p>')).toBe(
      '2 min read'
    );
    expect(calculateReadingTime('<p>' + 'word '.repeat(400) + '</p>')).toBe(
      '2 min read'
    );
  });

  it('never returns less than one minute', () => {
    expect(calculateReadingTime('')).toBe('1 min read');
    expect(calculateReadingTime('<p>hi</p>')).toBe('1 min read');
  });
});

describe('resolveExcerpt', () => {
  it('uses the rendered excerpt when present', () => {
    expect(resolveExcerpt('<p>Real excerpt</p>', '<p>body</p>')).toBe(
      '<p>Real excerpt</p>'
    );
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
    expect(
      upgradeContentToHttps(
        '<img src="http://a/b.jpg"><a href=\'http://c\'>x</a>'
      )
    ).toBe('<img src="https://a/b.jpg"><a href=\'https://c\'>x</a>');
  });

  it('leaves https and protocol-relative URLs alone', () => {
    expect(upgradeContentToHttps('<img src="https://a/b.jpg">')).toBe(
      '<img src="https://a/b.jpg">'
    );
    // upgradeContentToHttps only matches the literal string "http://", so a
    // genuinely protocol-relative URL ("//host/...") must pass through unchanged.
    expect(upgradeContentToHttps('<img src="//a/b.jpg">')).toBe(
      '<img src="//a/b.jpg">'
    );
  });

  it('upgrades a bare URL', () => {
    expect(upgradeUrlToHttps('http://a/b.jpg')).toBe('https://a/b.jpg');
    expect(upgradeUrlToHttps(undefined)).toBeUndefined();
  });
});

import { decodeEntities } from '../src/lib/normalize';

describe('decodeEntities', () => {
  it('decodes a numeric decimal entity', () => {
    expect(decodeEntities('Nuggets of Wisdom&#8217;s')).toBe(
      'Nuggets of Wisdom’s'
    );
  });

  it('decodes a numeric hex entity', () => {
    expect(decodeEntities('Nuggets of Wisdom&#x2019;s')).toBe(
      'Nuggets of Wisdom’s'
    );
  });

  it('fully resolves a double-encoded ampersand, &amp;#038;', () => {
    expect(decodeEntities('GED Examination Q&amp;#038;A')).toBe(
      'GED Examination Q&A'
    );
  });

  it('decodes &hellip;', () => {
    expect(decodeEntities('Nuggets of Wisdom&hellip;')).toBe(
      'Nuggets of Wisdom…'
    );
  });

  it('decodes curly quote entities &#8220; and &#8221;', () => {
    expect(
      decodeEntities('Celebrating the &#8220;Stupid question day&#8221;')
    ).toBe('Celebrating the “Stupid question day”');
  });

  it('decodes &amp;lt; to the literal string "&lt;", not "<" - amp must not be decoded before lt', () => {
    // If &amp; were unescaped before &lt;, the revealed "&lt;" would be
    // (wrongly) decoded again into "<". WordPress-escaped markup samples
    // ("&amp;lt;script&amp;gt;") must stay inert text, not become real tags.
    expect(decodeEntities('&amp;lt;')).toBe('&lt;');
  });

  // Comment content and term descriptions reach decodeEntities, so these are
  // reachable from visitor-submitted text. Before the code-point guard each of
  // these threw a RangeError out of String.fromCodePoint and crashed the build.
  it.each([
    ['&#1114112;', 'decimal one past the maximum'],
    ['&#x110000;', 'hex one past the maximum'],
    ['&#99999999999999;', 'far out of range'],
    ['&#xFFFFFFFFFF;', 'overlong hex, parseInt returns Infinity'],
  ])('preserves %s (%s) instead of throwing', (input) => {
    expect(() => decodeEntities(input)).not.toThrow();
    expect(decodeEntities(input)).toBe(input);
  });

  it('preserves lone surrogates rather than emitting ill-formed UTF-16', () => {
    // These do not throw, but they cannot be encoded as valid UTF-8 on the way
    // into a built page.
    expect(decodeEntities('&#xD800;')).toBe('&#xD800;');
    expect(decodeEntities('&#55296;')).toBe('&#55296;');
  });

  it('still decodes the highest code point it is allowed to', () => {
    expect(decodeEntities('&#x10FFFF;')).toBe(String.fromCodePoint(0x10ffff));
  });

  it('decodes valid entities either side of an out-of-range one', () => {
    expect(decodeEntities('a&#8217;b&#1114112;c&#8230;d')).toBe(
      'a\u2019b&#1114112;c\u2026d'
    );
  });

  it('leaves a string with no entities unchanged', () => {
    expect(decodeEntities('plain text, no entities here')).toBe(
      'plain text, no entities here'
    );
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
    expect(
      unwrapPhotonUrl('https://i0.wp.com/1.bp.blogspot.com/x/y.jpeg?w=840')
    ).toBe('https://1.bp.blogspot.com/x/y.jpeg');
  });

  it('leaves a non-Photon URL untouched', () => {
    expect(
      unwrapPhotonUrl(
        'https://www.computerjy.com/wp-content/uploads/2013/09/MacPC.jpg'
      )
    ).toBe('https://www.computerjy.com/wp-content/uploads/2013/09/MacPC.jpg');
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
    const html =
      '<img src="https://www.computerjy.com/wp-content/uploads/2013/09/MacPC.jpg">';
    expect(unwrapPhotonInContent(html)).toBe(html);
  });
});

import { normalizePost, DEFAULT_CATEGORY } from '../src/lib/normalize';
import type { RawWpPost } from '../src/lib/normalize';

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
    expect(normalizePost(raw, new Map(), terms).slug).toBe('ابليس-والعرب');
  });

  it('maps category and tag ids to slug strings', () => {
    const p = normalizePost(raw, new Map(), terms);
    expect(p.categories).toEqual(['g33ky', 'fun']);
    expect(p.tags).toEqual(['humor']);
  });

  it('drops a term id that is absent from termsById instead of producing undefined', () => {
    const p = normalizePost(
      { ...raw, categories: [7, 999], tags: [999] },
      new Map(),
      terms
    );
    expect(p.categories).toEqual(['g33ky']);
    expect(p.categories).not.toContain(undefined);
    expect(p.tags).toEqual([]);
    expect(p.tags).not.toContain(undefined);
  });

  it('uses the first category as primaryCategory', () => {
    expect(normalizePost(raw, new Map(), terms).primaryCategory).toEqual({
      name: 'Geeky',
      slug: 'g33ky',
    });
  });

  it('falls back to the Tech default when a post has no categories', () => {
    const p = normalizePost({ ...raw, categories: [] }, new Map(), terms);
    expect(p.primaryCategory).toEqual(DEFAULT_CATEGORY);
    expect(DEFAULT_CATEGORY).toEqual({ name: 'Tech', slug: 'tech' });
  });

  it('resolves featured media by id when present', () => {
    const media = new Map([[5, 'https://x.com/feat.jpg']]);
    const p = normalizePost({ ...raw, featured_media: 5 }, media, terms);
    expect(p.featuredImageUrl).toBe('https://x.com/feat.jpg');
  });

  it('computes reading time from the content', () => {
    expect(normalizePost(raw, new Map(), terms).readingTime).toBe(
      '2 min read'
    );
  });

  it('upgrades http URLs inside content', () => {
    const p = normalizePost(
      { ...raw, content: { rendered: '<img src="http://a/b.jpg">' } },
      new Map(),
      terms
    );
    expect(p.content.rendered).toBe('<img src="https://a/b.jpg">');
  });

  it('decodes HTML entities in the title and excerpt, but not in content', () => {
    const p = normalizePost(
      {
        ...raw,
        title: { rendered: 'GED Examination Q&amp;#038;A' },
        excerpt: { rendered: '<p>Nuggets of Wisdom&#8230;</p>' },
        content: { rendered: '<p>&amp;#038; stays encoded here</p>' },
      },
      new Map(),
      terms
    );
    expect(p.title.rendered).toBe('GED Examination Q&A');
    expect(p.excerpt.rendered).toBe('<p>Nuggets of Wisdom…</p>');
    expect(p.content.rendered).toBe('<p>&amp;#038; stays encoded here</p>');
  });
});

describe('unwrapPhoton host anchoring', () => {
  // Raised by CodeQL js/incomplete-url-substring-sanitization: a substring check
  // cannot distinguish a host from a look-alike. These pin the anchored behaviour.
  it('ignores a look-alike host that merely mentions .wp.com/ in a query', () => {
    const html = '<img src="https://evil.com/?x=.wp.com/pwn.jpg">';
    expect(unwrapPhotonInContent(html)).toBe(html);
  });

  it('ignores a host that only prefixes i0.wp.com', () => {
    const html = '<img src="https://i0.wp.com.evil.com/pwn.jpg">';
    expect(unwrapPhotonInContent(html)).toBe(html);
  });

  it('ignores a Photon-looking path on another host', () => {
    const html = '<img src="https://evil.com/i0.wp.com/x.jpg">';
    expect(unwrapPhotonInContent(html)).toBe(html);
  });

  it('still unwraps a genuine Photon URL alongside a look-alike', () => {
    const html =
      '<img src="https://evil.com/?x=.wp.com/a.jpg"><img src="https://i0.wp.com/example.com/b.jpg?w=1">';
    expect(unwrapPhotonInContent(html)).toBe(
      '<img src="https://evil.com/?x=.wp.com/a.jpg"><img src="https://example.com/b.jpg">'
    );
  });
});

import { pickHeroImageUrl, HERO_TARGET_WIDTH } from '../src/lib/normalize';

describe('pickHeroImageUrl', () => {
  const full =
    'https://www.computerjy.com/wp-content/uploads/2011/05/Defrag.jpg';
  const dir = 'https://www.computerjy.com/wp-content/uploads/2011/05';

  it('falls back to the original when there are no sizes at all', () => {
    expect(pickHeroImageUrl(full)).toBe(full);
    expect(pickHeroImageUrl(full, {})).toBe(full);
    expect(pickHeroImageUrl(full, { sizes: {} })).toBe(full);
  });

  it('builds the local derivative URL from `file`, not the Photon source_url', () => {
    // Real shape of attachment 1522: 830x610 original, medium_large 768x564.
    // Its size.source_url is https://i0.wp.com/...Defrag.jpg?fit=768%2C564 --
    // the ORIGINAL plus a resize parameter, which unwrapPhotonUrl would reduce
    // straight back to the full-size file. Only `file` names the derivative.
    expect(
      pickHeroImageUrl(full, {
        sizes: {
          thumbnail: { file: 'Defrag-150x150.jpg', width: 150 },
          medium: { file: 'Defrag-300x220.jpg', width: 300 },
          medium_large: { file: 'Defrag-768x564.jpg', width: 768 },
          full: { file: 'Defrag.jpg', width: 830 },
        },
      })
    ).toBe(`${dir}/Defrag-768x564.jpg`);
  });

  it('keeps the original when every derivative is too small', () => {
    // facebook.jpg is 603x763; its largest derivative is 237x300. Serving that
    // into a 700px slot is the pre-migration behaviour issue #14 mistook for a
    // payload regression.
    expect(
      pickHeroImageUrl(full, {
        sizes: {
          thumbnail: { file: 'facebook-150x150.jpg', width: 150 },
          medium: { file: 'facebook-237x300.jpg', width: 237 },
        },
      })
    ).toBe(full);
  });

  it('takes the smallest derivative at or above the target, not the largest', () => {
    expect(
      pickHeroImageUrl(full, {
        sizes: {
          a: { file: 'x-699x400.jpg', width: HERO_TARGET_WIDTH - 1 },
          b: { file: 'x-700x400.jpg', width: HERO_TARGET_WIDTH },
          c: { file: 'x-1600x900.jpg', width: 1600 },
        },
      })
    ).toBe(`${dir}/x-700x400.jpg`);
  });

  it('ignores malformed size entries', () => {
    expect(
      pickHeroImageUrl(full, {
        sizes: {
          broken: undefined,
          nofile: { width: 900 } as never,
          nowidth: { file: 'x.jpg' } as never,
          good: { file: 'g-900x600.jpg', width: 900 },
        },
      })
    ).toBe(`${dir}/g-900x600.jpg`);
  });

  it('leaves a URL with no path separator alone', () => {
    expect(
      pickHeroImageUrl('Defrag.jpg', {
        sizes: { a: { file: 'b.jpg', width: 900 } },
      })
    ).toBe('Defrag.jpg');
  });
});
