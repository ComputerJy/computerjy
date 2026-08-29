import rss from '@astrojs/rss';
import { getPosts } from '../lib/api';
import { stripHtml } from '../lib/utils';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getPosts();

  return rss({
    title: 'ComputerJy World',
    description:
      'Entertainment, Tech tips & Occasional software reviews by Eyad Salah.',
    site: context.site || 'https://www.computerjy.com',
    items: posts.map((post) => ({
      title: stripHtml(post.title.rendered),
      pubDate: new Date(post.date),
      description: stripHtml(post.excerpt.rendered),
      link: `/posts/${post.slug}`,
    })),
    customData: `<language>en-us</language>`,
  });
}
