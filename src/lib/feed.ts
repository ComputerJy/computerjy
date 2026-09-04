/**
 * Homepage feed windowing, shared by index.astro and page/[page].astro so the
 * two cannot drift apart.
 *
 * The bento showcase re-features the newest posts rather than consuming them:
 * only the hero (index 0) is withheld from the chronological feed. Excluding
 * all four bento slots is what made "Latest Articles & Insights" lead with
 * 2014 content - a post reached the feed only once it was the fifth-newest.
 */

/** Posts withheld from the feed: the bento hero at index 0. */
export const HERO_COUNT = 1;

/** Feed posts per page. */
export const PAGE_SIZE = 12;

/** The chronological feed: every post except the bento hero. */
export function feedWindow<T>(posts: readonly T[]): T[] {
  return posts.slice(HERO_COUNT);
}

/** Pages the feed spans, given the total post count. Never less than one. */
export function feedPageCount(totalPosts: number): number {
  return Math.max(1, Math.ceil((totalPosts - HERO_COUNT) / PAGE_SIZE));
}
