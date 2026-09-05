/**
 * ComputerJy edge Worker — serves the Astro build out of R2, leaves WordPress
 * on Lightsail.
 *
 * All routing decisions live in `router.ts` and are unit-tested. This file is
 * the I/O shell: R2 reads, conditional/range handling, the edge cache, and the
 * pass-through to the origin.
 *
 * Origin pass-through is a plain `fetch(request)`. A Worker subrequest to a
 * route handled by the same Worker is not dispatched back into the Worker — it
 * goes to the zone's origin — so the Lightsail host never needs naming here.
 */

import {
  COMMENTS_CACHE_CONTROL,
  SECURITY_HEADERS,
  cacheControlForKey,
  contentTypeForKey,
  forcedContentType,
  isCacheableCommentsRequest,
  route,
} from './router';

/**
 * Hand-written subset of the Cloudflare runtime surface this Worker touches.
 * Declaring it locally keeps `@cloudflare/workers-types` out of the project —
 * that package replaces the DOM lib globally, which the Astro site's own
 * `tsconfig` depends on.
 */
interface R2ObjectBody {
  writeHttpMetadata(headers: Headers): void;
  readonly httpEtag: string;
  readonly size: number;
  readonly body?: ReadableStream;
  readonly range?: { offset?: number; length?: number; suffix?: number };
}

interface R2Bucket {
  get(
    key: string,
    options?: { onlyIf?: Headers; range?: Headers }
  ): Promise<R2ObjectBody | null>;
  head(key: string): Promise<{ readonly httpEtag: string } | null>;
}

interface Env {
  ASSETS: R2Bucket;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

/** `caches.default` is a Workers extension the DOM `CacheStorage` type lacks. */
interface WorkerCache {
  match(request: Request): Promise<Response | undefined>;
  put(request: Request, response: Response): Promise<void>;
}

function edgeCache(): WorkerCache {
  return (caches as unknown as { default: WorkerCache }).default;
}

function applyStandardHeaders(headers: Headers): void {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
}

/**
 * Builds the response headers for one R2 object: what R2 stored, then the
 * vhost's forced content types, then cache policy, then the always-set block.
 */
function assetHeaders(
  key: string,
  pathname: string,
  object: R2ObjectBody
): Headers {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('ETag', object.httpEtag);

  const forced = forcedContentType(pathname);
  if (forced !== null) {
    headers.set('Content-Type', forced.type);
    if (forced.cors) headers.set('Access-Control-Allow-Origin', '*');
  } else if (!headers.has('Content-Type')) {
    headers.set('Content-Type', contentTypeForKey(key));
  }

  headers.set('Cache-Control', cacheControlForKey(key));
  applyStandardHeaders(headers);
  return headers;
}

function isConditional(request: Request): boolean {
  return (
    request.headers.has('If-None-Match') ||
    request.headers.has('If-Modified-Since') ||
    request.headers.has('Range')
  );
}

/** Reads one key from R2, honouring conditional and range requests. */
async function serveKey(
  bucket: R2Bucket,
  key: string,
  pathname: string,
  request: Request
): Promise<Response | null> {
  const object = await bucket.get(key, {
    onlyIf: request.headers,
    range: request.headers,
  });
  if (object === null) return null;

  const headers = assetHeaders(key, pathname, object);

  // No body means R2 satisfied a precondition without transferring anything.
  if (object.body === undefined) {
    const status = request.headers.has('If-None-Match') ? 304 : 412;
    return new Response(null, { status, headers });
  }

  if (object.range !== undefined && request.headers.has('Range')) {
    const offset = object.range.offset ?? 0;
    const length = object.range.length ?? object.size - offset;
    const end = offset + length - 1;
    headers.set('Content-Range', `bytes ${offset}-${end}/${object.size}`);
    return new Response(object.body, { status: 206, headers });
  }

  return new Response(object.body, { status: 200, headers });
}

/** The build's 404 page, served with a 404 status rather than a redirect. */
async function serveNotFound(bucket: R2Bucket): Promise<Response> {
  const object = await bucket.get('404.html');
  const headers = new Headers({
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=0, must-revalidate',
  });
  applyStandardHeaders(headers);

  if (object === null || object.body === undefined) {
    return new Response('Not Found', { status: 404, headers });
  }
  return new Response(object.body, { status: 404, headers });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const decision = route(url, request.method, request.headers.get('Accept'));

    if (decision.kind === 'forbidden') {
      const headers = new Headers({
        'Content-Type': 'text/plain; charset=utf-8',
      });
      applyStandardHeaders(headers);
      return new Response('Forbidden', { status: 403, headers });
    }

    if (decision.kind === 'origin') {
      if (!isCacheableCommentsRequest(url, request.method)) {
        return fetch(request);
      }

      const commentsCache = edgeCache();
      const commentsKey = new Request(url.toString(), { method: 'GET' });
      const cached = await commentsCache.match(commentsKey);
      if (cached !== undefined) return cached;

      const origin = await fetch(request);
      // Only a good read is worth holding: caching an error would repeat it for
      // a minute, and a Set-Cookie in a shared cache would leak between readers.
      if (origin.status !== 200) return origin;

      const response = new Response(origin.body, origin);
      response.headers.set('Cache-Control', COMMENTS_CACHE_CONTROL);
      response.headers.delete('Set-Cookie');
      ctx.waitUntil(commentsCache.put(commentsKey, response.clone()));
      return response;
    }

    if (decision.kind === 'redirect') {
      // Confirmed before redirecting: a slug that no longer exists gets the 404
      // page, not a hop into one.
      const target = await env.ASSETS.head(decision.verifyKey);
      if (target === null) return serveNotFound(env.ASSETS);

      const headers = new Headers({
        Location: `${decision.location}${url.search}`,
        // Long enough to spare the lookup, short enough that a wrong answer is
        // not cached for a year.
        'Cache-Control': 'public, max-age=86400',
      });
      applyStandardHeaders(headers);
      return new Response(null, { status: 301, headers });
    }

    // Plain reads can come straight off the edge; anything conditional or
    // ranged is answered by R2 so the validators stay accurate.
    const cache = edgeCache();
    const cacheKey = new Request(url.toString(), { method: 'GET' });
    const cacheable = !isConditional(request);

    if (cacheable) {
      const hit = await cache.match(cacheKey);
      if (hit !== undefined) return hit;
    }

    for (const key of decision.candidates) {
      const response = await serveKey(env.ASSETS, key, url.pathname, request);
      if (response === null) continue;

      if (cacheable && response.status === 200) {
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
      return response;
    }

    return serveNotFound(env.ASSETS);
  },
};
