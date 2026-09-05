import { describe, it, expect } from 'vitest';
import { commentsEndpoint, toCommentViews } from '../src/lib/comments';

describe('commentsEndpoint', () => {
  it('asks for one post, oldest first, with only the fields rendered', () => {
    const url = new URL(commentsEndpoint(13213), 'https://www.computerjy.com');
    expect(url.pathname).toBe('/wp-json/wp/v2/comments');
    expect(url.searchParams.get('post')).toBe('13213');
    expect(url.searchParams.get('order')).toBe('asc');
    expect(url.searchParams.get('per_page')).toBe('100');
  });

  it('busts the edge cache when asked, so a commenter sees their own comment', () => {
    const plain = commentsEndpoint(13213);
    const busted = commentsEndpoint(13213, true);
    expect(busted).not.toBe(plain);
    expect(busted).toContain('post=13213');
  });
});

describe('toCommentViews', () => {
  const base = { id: 1, author_name: 'Deco', date: '2026-09-05T00:14:18' };

  it('keeps whitelisted formatting tags', () => {
    const [view] = toCommentViews([
      { ...base, content: { rendered: 'a <b>bold</b> point' } },
    ]);
    expect(view.html).toBe('a <b>bold</b> point');
  });

  it('neutralises script tags and attributes', () => {
    const [view] = toCommentViews([
      {
        ...base,
        content: { rendered: '<script>alert(1)</script><a href="x">hi</a>' },
      },
    ]);
    // escapeHtml escapes the delimiters, not attribute names: `href` survives
    // as inert text inside `&lt;a href=&quot;x&quot;&gt;`. The property that
    // matters is that no live markup reaches innerHTML.
    expect(view.html).not.toContain('<script');
    expect(view.html).not.toContain('<a');
    expect(view.html).toContain('&lt;script&gt;');
  });

  it('decodes entities the way the build loader did', () => {
    const [view] = toCommentViews([
      { ...base, content: { rendered: 'Q&amp;A' } },
    ]);
    expect(view.html).toBe('Q&amp;A');
  });

  it('derives the avatar initial and survives a missing author', () => {
    const [view] = toCommentViews([{ ...base, author_name: '' }]);
    expect(view.author).toBe('Anonymous');
    expect(view.initial).toBe('A');
  });

  it('tolerates a comment with no content', () => {
    const [view] = toCommentViews([{ ...base, content: undefined }]);
    expect(view.html).toBe('');
  });
});
