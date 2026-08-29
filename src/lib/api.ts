import { getCollection } from 'astro:content';
import type { WPPost, WPCategory, WPTag } from './types';

/** Newest first, matching parse_wp_export.py's ordering. */
export async function getPosts(): Promise<WPPost[]> {
  const entries = await getCollection('posts');
  return entries
    .map((e) => e.data)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Most-used first, matching parse_wp_export.py's ordering. */
export async function getCategories(): Promise<WPCategory[]> {
  const entries = await getCollection('categories');
  return entries.map((e) => e.data).sort((a, b) => b.count - a.count);
}

export async function getTags(): Promise<WPTag[]> {
  const entries = await getCollection('tags');
  return entries.map((e) => e.data).sort((a, b) => b.count - a.count);
}
