import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import {
  wpPostsLoader,
  wpCategoriesLoader,
  wpTagsLoader,
} from './lib/wp-loader';

const renderedSchema = z.object({ rendered: z.string() });

const commentSchema = z.object({
  id: z.number(),
  post_id: z.number(),
  author: z.string(),
  date: z.string(),
  content: z.string(),
  parent: z.number(),
});

const termSchema = z.object({ name: z.string(), slug: z.string() });

const posts = defineCollection({
  loader: wpPostsLoader(),
  schema: z.object({
    id: z.number(),
    slug: z.string().min(1),
    title: renderedSchema,
    excerpt: renderedSchema,
    content: renderedSchema,
    date: z.string(),
    modified: z.string(),
    categories: z.array(z.string()),
    tags: z.array(z.string()),
    primaryCategory: termSchema,
    featuredImageUrl: z.string().url(),
    readingTime: z.string(),
    comments: z.array(commentSchema),
  }),
});

const termCollectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string().min(1),
  count: z.number(),
  description: z.string(),
});

const categories = defineCollection({
  loader: wpCategoriesLoader(),
  schema: termCollectionSchema,
});
const tags = defineCollection({
  loader: wpTagsLoader(),
  schema: termCollectionSchema,
});

export const collections = { posts, categories, tags };
