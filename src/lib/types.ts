import type { CollectionEntry } from 'astro:content';

/**
 * Types are derived from the Zod schemas in src/content.config.ts, so they can
 * no longer drift from the data.
 *
 * The hand-written interfaces this replaces still claimed `categories: number[]`
 * and `tags: number[]` while the data held slug strings - the exact lie behind the
 * broken tag filter fixed in Task 8. They also carried `_embedded` and
 * `featured_media`, which no code reads and the loader never produces.
 * (`comments` and `modified` were declared by a later commit; the array-of-number
 * claims were not.)
 */
export type WPPost = CollectionEntry<'posts'>['data'];
export type WPCategory = CollectionEntry<'categories'>['data'];
export type WPTag = CollectionEntry<'tags'>['data'];
export type WPComment = WPPost['comments'][number];
