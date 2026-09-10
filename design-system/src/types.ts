/** Flat, agent-friendly shape every card component consumes. */
export interface PostSummary {
  title: string;
  /** Absolute path to the article, e.g. `/posts/my-slug`. */
  href: string;
  imageUrl: string;
  /** Plain text — already stripped of markup. */
  excerpt: string;
  /** ISO date string; components format it for display. */
  date: string;
  readingTime: string;
  category: string;
}

/**
 * The structural subset of the site's `WPPost` that `fromPost` reads.
 * Intentionally not imported from `astro:content`, which only resolves
 * inside an Astro build.
 */
export interface WPPostLike {
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  date: string;
  readingTime?: string;
  primaryCategory?: { name: string; slug: string };
  featuredImageUrl: string;
}

/** A category or tag term as the sidebar renders it. */
export interface TermSummary {
  name: string;
  slug: string;
  count: number;
}

/** A trending-list entry: title, link and date only. */
export interface TrendingItem {
  title: string;
  href: string;
  date: string;
}
