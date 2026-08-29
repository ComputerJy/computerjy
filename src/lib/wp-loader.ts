import type { Loader, LoaderContext } from 'astro/loaders';
import { fetchAllPaginated, fetchByIds } from './wp-client';
import { normalizePost } from './normalize';
import type { RawWpPost, NormalizedComment, Term } from './normalize';

const POST_FIELDS = 'id,slug,title,excerpt,content,date,modified,categories,tags,featured_media';
const TERM_FIELDS = 'id,name,slug,count,description';
const MEDIA_FIELDS = 'id,source_url';
const COMMENT_FIELDS = 'id,post,parent,author_name,date,content';

interface RawTerm { id: number; name: string; slug: string; count: number; description?: string }
interface RawMedia { id: number; source_url: string }
interface RawComment {
  id: number; post: number; parent: number;
  author_name: string; date: string; content: { rendered: string };
}

export function wpPostsLoader(): Loader {
  return {
    name: 'wp-posts',
    async load({ store, parseData, logger }: LoaderContext): Promise<void> {
      logger.info('Fetching content from the WordPress REST API');

      const [rawPosts, rawCategories, rawTags, rawComments] = await Promise.all([
        fetchAllPaginated<RawWpPost>('posts', POST_FIELDS),
        fetchAllPaginated<RawTerm>('categories', TERM_FIELDS),
        fetchAllPaginated<RawTerm>('tags', TERM_FIELDS),
        fetchAllPaginated<RawComment>('comments', COMMENT_FIELDS),
      ]);

      // Posts reference only a handful of media ids; fetch exactly those rather
      // than the full media library (see wp-client.ts fetchByIds - the site's
      // media X-WP-Total disagrees with what pagination actually returns).
      const mediaIds = [...new Set(rawPosts.map((p) => p.featured_media).filter((id) => id > 0))];
      const rawMedia = await fetchByIds<RawMedia>('media', MEDIA_FIELDS, mediaIds);

      const termsById = new Map<number, Term>();
      for (const t of [...rawCategories, ...rawTags]) {
        termsById.set(t.id, { name: t.name, slug: t.slug });
      }

      const mediaById = new Map<number, string>(rawMedia.map((m) => [m.id, m.source_url]));

      const commentsByPostId = new Map<number, NormalizedComment[]>();
      for (const c of rawComments) {
        const list = commentsByPostId.get(c.post) ?? [];
        list.push({
          id: c.id,
          post_id: c.post,
          author: c.author_name,
          date: c.date,
          content: c.content?.rendered ?? '',
          parent: c.parent ?? 0,
        });
        commentsByPostId.set(c.post, list);
      }

      const posts = rawPosts
        .map((raw) => normalizePost(raw, mediaById, termsById, commentsByPostId))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // The store persists across builds. Clearing first means a shrunken or
      // empty fetch can never leave the previous build's entries in place.
      store.clear();
      for (const post of posts) {
        const data = await parseData({ id: post.slug, data: post });
        store.set({ id: post.slug, data });
      }
      logger.info(`Loaded ${posts.length} posts`);
    },
  };
}

function termLoader(name: string, endpoint: string): Loader {
  return {
    name,
    async load({ store, parseData, logger }: LoaderContext): Promise<void> {
      const terms = await fetchAllPaginated<RawTerm>(endpoint, TERM_FIELDS);
      // parse_wp_export.py emitted only terms that had posts, sorted by count desc.
      const active = terms
        .filter((t) => t.count > 0)
        .sort((a, b) => b.count - a.count);
      store.clear();
      for (const t of active) {
        const data = await parseData({
          id: t.slug,
          data: {
            id: t.id,
            name: t.name,
            slug: t.slug,
            count: t.count,
            description: t.description ?? '',
          },
        });
        store.set({ id: t.slug, data });
      }
      logger.info(`Loaded ${active.length} ${endpoint}`);
    },
  };
}

export const wpCategoriesLoader = (): Loader => termLoader('wp-categories', 'categories');
export const wpTagsLoader = (): Loader => termLoader('wp-tags', 'tags');
