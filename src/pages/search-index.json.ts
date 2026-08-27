import { getPosts } from '../lib/api';
import { stripHtml } from '../lib/utils';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getPosts();

  const searchData = posts.map((post) => ({
    id: post.id,
    title: stripHtml(post.title.rendered),
    slug: post.slug,
    date: new Date(post.date).toLocaleDateString('en-GB'),
    category: post.primaryCategory?.name || 'Tech',
    excerpt: stripHtml(post.excerpt.rendered).slice(0, 120),
  }));

  return new Response(JSON.stringify(searchData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
