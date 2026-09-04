import { describe, it, expect } from 'vitest';
import { PAGE_SIZE, feedWindow, feedPageCount } from '../src/lib/feed';

/**
 * Mirrors the real archive shape that surfaced the bug: three 2026 posts
 * followed by an 11-year cliff into the 2014/2015 backlog.
 */
const posts = [
  { slug: 'reclaiming-the-web', date: '2026-09-05T02:26:46' },
  { slug: 'great-desktop-divide', date: '2026-09-03T02:51:33' },
  { slug: 'choosing-a-linux-distro', date: '2026-08-30T02:23:52' },
  { slug: 'clickbait-headlines', date: '2015-07-27T17:01:15' },
  ...Array.from({ length: 412 }, (_, i) => ({
    slug: `archive-${i}`,
    date: '2014-08-31T15:18:01',
  })),
];

describe('feedWindow', () => {
  it('leads with the second-newest post, not the archive backlog', () => {
    // The regression: the feed used to start at index 4, so its first card
    // was an 11-year-old post no matter how much new content was published.
    expect(feedWindow(posts)[0].slug).toBe('great-desktop-divide');
  });

  it('surfaces a newly published post on the next build', () => {
    const withNewPost = [
      { slug: 'brand-new', date: '2026-09-07T00:00:00' },
      ...posts,
    ];
    const firstPage = feedWindow(withNewPost).slice(0, PAGE_SIZE);
    // The new post takes the hero slot and displaces the previous hero into
    // the top of the feed - the section visibly changes on every publish.
    expect(firstPage[0].slug).toBe('reclaiming-the-web');
    expect(firstPage.map((p) => p.slug)).not.toContain('brand-new');
  });

  it('excludes only the hero, so the 3 bento side posts still appear', () => {
    const slugs = feedWindow(posts).map((p) => p.slug);
    expect(slugs).not.toContain('reclaiming-the-web');
    expect(slugs).toContain('great-desktop-divide');
    expect(slugs).toContain('choosing-a-linux-distro');
    expect(slugs).toContain('clickbait-headlines');
  });

  it('drops exactly one post from the full list', () => {
    expect(feedWindow(posts)).toHaveLength(posts.length - 1);
  });

  it('is safe on an empty or single-post archive', () => {
    expect(feedWindow([])).toEqual([]);
    expect(feedWindow([posts[0]])).toEqual([]);
  });
});

describe('feedPageCount', () => {
  it('counts pages over the feed window, not the full post list', () => {
    // 416 posts - 1 hero = 415 feed posts -> ceil(415/12) = 35 pages.
    expect(feedPageCount(416)).toBe(35);
  });

  it('agrees with the number of pages the feed window actually fills', () => {
    // Guards index.astro and page/[page].astro drifting apart: the homepage
    // renders totalPages while paginate() derives lastPage independently.
    const expected = Math.ceil(feedWindow(posts).length / PAGE_SIZE);
    expect(feedPageCount(posts.length)).toBe(expected);
  });

  it('never reports zero pages for a tiny archive', () => {
    expect(feedPageCount(0)).toBe(1);
    expect(feedPageCount(1)).toBe(1);
  });
});
