import { getPosts } from '../lib/api';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getPosts();

  const searchData = posts.map((post) => ({
    id: post.id,
    title: post.title.rendered,
    slug: post.slug,
    date: new Date(post.date).toLocaleDateString('en-GB'),
    category: post.primaryCategory?.name || 'Tech',
    excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '').slice(0, 120),
  }));

  return new Response(JSON.stringify(searchData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
