import { sanitizeCommentHtml } from './utils';
import { decodeEntities } from './normalize';

/** The subset of a wp/v2/comments item this site reads. */
export interface RestComment {
  id: number;
  author_name: string;
  date: string;
  content?: { rendered?: string };
  parent?: number;
}

/** One comment, ready to render. `html` is already sanitized. */
export interface CommentView {
  id: number;
  author: string;
  initial: string;
  date: string;
  html: string;
}

const FIELDS = 'id,author_name,date,content,parent';

/**
 * Builds the comment list request for one post.
 *
 * `per_page=100` is a ceiling rather than pagination: no post here is close to
 * it. If one ever is, `X-WP-TotalPages` on the response is the signal to add
 * paging — until then it stays unwritten.
 *
 * `bust` appends a unique parameter, which changes the edge cache key and so
 * forces a fresh read. It is used once, right after a visitor submits, so they
 * see their own comment instead of a cached list from up to a minute ago.
 */
export function commentsEndpoint(postId: number, bust = false): string {
  const params = new URLSearchParams({
    post: String(postId),
    per_page: '100',
    orderby: 'date',
    order: 'asc',
    _fields: FIELDS,
  });
  if (bust) params.set('_ts', String(Date.now()));
  return `/wp-json/wp/v2/comments?${params.toString()}`;
}

/**
 * Turns the REST payload into render-ready views.
 *
 * decode-then-sanitize is the order the build used (decodeEntities in the
 * loader, sanitizeCommentHtml at render). Keep it: sanitizeCommentHtml escapes
 * everything before restoring its whitelist, so decoding first cannot smuggle a
 * tag past it.
 */
export function toCommentViews(raw: RestComment[]): CommentView[] {
  return raw.map((c) => {
    const author = c.author_name?.trim() || 'Anonymous';
    return {
      id: c.id,
      author,
      initial: author.charAt(0).toUpperCase(),
      date: c.date,
      html: sanitizeCommentHtml(decodeEntities(c.content?.rendered ?? '')),
    };
  });
}
