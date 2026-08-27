import type { WPPost, WPCategory, WPTag } from './types';
import localPosts from '../data/posts.json';
import localCategories from '../data/categories.json';
import localTags from '../data/tags.json';
import localPages from '../data/pages.json';

const WP_API_URL = 'https://www.computerjy.com/wp-json/wp/v2';

// Helper to sanitize http -> https to avoid insecure mixed-content warnings
function sanitizeUrl(url?: string): string | undefined {
  if (!url) return url;
  if (url.startsWith('http://')) {
    return url.replace(/^http:\/\//, 'https://');
  }
  return url;
}

function sanitizePost(post: WPPost): WPPost {
  let content = post.content?.rendered || '';
  if (content.includes('http://')) {
    content = content
      .replace(/src="http:\/\//g, 'src="https://')
      .replace(/src='http:\/\//g, "src='https://")
      .replace(/href="http:\/\//g, 'href="https://')
      .replace(/href='http:\/\//g, "href='https://");
  }
  return {
    ...post,
    featuredImageUrl: sanitizeUrl(post.featuredImageUrl),
    content: {
      rendered: content,
    },
  };
}

const sanitizedPosts = (localPosts as unknown as WPPost[]).map(sanitizePost);

// 1. Get all published posts (all 413 articles from archive)
export async function getPosts(): Promise<WPPost[]> {
  return sanitizedPosts;
}

// 2. Get single post by slug
export async function getPostBySlug(slug: string): Promise<WPPost | undefined> {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug);
}

// 3. Get all active categories
export async function getCategories(): Promise<WPCategory[]> {
  return localCategories as unknown as WPCategory[];
}

// 4. Get all active tags
export async function getTags(): Promise<WPTag[]> {
  return localTags as unknown as WPTag[];
}

// 5. Get all pages
export async function getPages(): Promise<WPPost[]> {
  return (localPages as unknown as WPPost[]).map(sanitizePost);
}

// 6. Optional: Live sync from WordPress REST API (if desired during development)
export async function fetchLivePosts(): Promise<WPPost[]> {
  try {
    const res = await fetch(`${WP_API_URL}/posts?_embed&per_page=100`);
    if (!res.ok) return sanitizedPosts;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 
      ? (data as unknown as WPPost[]).map(sanitizePost) 
      : sanitizedPosts;
  } catch (e) {
    return sanitizedPosts;
  }
}
