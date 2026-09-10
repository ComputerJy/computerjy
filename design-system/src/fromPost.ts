import type { PostSummary, WPPostLike } from './types';

/**
 * Maps a WordPress post onto flat card props, carrying the same fallbacks the
 * Astro components apply inline: excerpt tag-stripping, the `Tech` category
 * default, and the `3 min read` reading-time default.
 */
export function fromPost(post: WPPostLike): PostSummary {
  return {
    title: post.title.rendered,
    href: `/posts/${post.slug}`,
    imageUrl: post.featuredImageUrl,
    excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, ''),
    date: post.date,
    readingTime: post.readingTime || '3 min read',
    category: post.primaryCategory?.name || 'Tech',
  };
}
