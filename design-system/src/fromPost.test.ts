import { describe, expect, it } from 'vitest';
import { fromPost } from './fromPost';
import type { WPPostLike } from './types';

const base: WPPostLike = {
  slug: 'hello-world',
  title: { rendered: 'Hello World' },
  excerpt: { rendered: '<p>An <b>excerpt</b> here.</p>' },
  date: '2026-01-15T09:30:00',
  readingTime: '5 min read',
  primaryCategory: { name: 'Reviews', slug: 'reviews' },
  featuredImageUrl: 'https://www.computerjy.com/img/hello.jpg',
};

describe('fromPost', () => {
  it('maps a post onto flat card props', () => {
    expect(fromPost(base)).toEqual({
      title: 'Hello World',
      href: '/posts/hello-world',
      imageUrl: 'https://www.computerjy.com/img/hello.jpg',
      excerpt: 'An excerpt here.',
      date: '2026-01-15T09:30:00',
      readingTime: '5 min read',
      category: 'Reviews',
    });
  });

  it('strips every html tag from the excerpt', () => {
    const out = fromPost({
      ...base,
      excerpt: { rendered: '<p>Tags <a href="#">and</a> more</p>' },
    });
    expect(out.excerpt).toBe('Tags and more');
  });

  it('falls back to "Tech" when there is no primary category', () => {
    const { primaryCategory: _omit, ...rest } = base;
    expect(fromPost(rest).category).toBe('Tech');
  });

  it('falls back to "3 min read" when readingTime is missing or empty', () => {
    const { readingTime: _omit, ...rest } = base;
    expect(fromPost(rest).readingTime).toBe('3 min read');
    expect(fromPost({ ...base, readingTime: '' }).readingTime).toBe(
      '3 min read'
    );
  });
});
