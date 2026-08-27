import rss from '@astrojs/rss';
import { getPosts } from '../lib/api';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getPosts();

  return rss({
    title: 'ComputerJy World',
    description: 'Entertainment, Tech tips & Occasional software reviews by Eyad Salah.',
    site: context.site || 'https://www.computerjy.com',
    items: posts.map((post) => ({
      title: post.title.rendered,
      pubDate: new Date(post.date),
      description: post.excerpt.rendered.replace(/<[^>]*>/g, ''),
      link: `/posts/${post.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
