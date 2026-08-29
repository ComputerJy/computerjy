import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from '../workers/edge-router/src/index';
import {
  LINK_HEADER,
  LINKSET_CONTENT_TYPE,
} from '../workers/edge-router/src/router';

/**
 * A stand-in for the R2 binding: a map of key -> [body, storedContentType].
 * Only the surface `index.ts` declares is implemented.
 */
function fakeBucket(objects: Record<string, [string, string?]>) {
  return {
    reads: [] as string[],
    async get(key: string) {
      this.reads.push(key);
      const entry = objects[key];
      if (entry === undefined) return null;
      const [body, contentType] = entry;
      return {
        writeHttpMetadata(headers: Headers) {
          if (contentType !== undefined)
            headers.set('Content-Type', contentType);
        },
        httpEtag: `"etag-${key}"`,
        size: body.length,
        body: new Response(body).body ?? undefined,
      };
    },
    async head(key: string) {
      this.reads.push(`HEAD ${key}`);
      return objects[key] === undefined ? null : { httpEtag: `"etag-${key}"` };
    },
  };
}

/** `caches.default` does not exist in Node; the Worker only needs a miss. */
const noopCache = {
  match: async () => undefined,
  put: async () => undefined,
};

const ctx = { waitUntil: () => undefined };

beforeEach(() => {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: noopCache,
  };
});

function get(path: string, init?: RequestInit) {
  return new Request(`https://www.computerjy.com${path}`, init);
}

const BUILD = {
  'index.html': ['<html>home</html>', 'text/html'],
  '404.html': ['<html>not found</html>', 'text/html'],
  'posts/some-slug/index.html': ['<html>post</html>', 'text/html'],
  '_astro/app.abc123.css': ['body{}', 'text/css'],
  'rss.xml': ['<rss/>', 'application/xml'],
  // Extensionless: the CLI stores these as octet-stream, as the real sync does.
  '.well-known/api-catalog': ['{"linkset":[]}', 'binary/octet-stream'],
  '.well-known/agent-card.json': ['{}', 'binary/octet-stream'],
} satisfies Record<string, [string, string?]>;

describe('serving the build from R2', () => {
  it('serves the root index', async () => {
    const bucket = fakeBucket(BUILD);
    const res = await worker.fetch(get('/'), { ASSETS: bucket }, ctx);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('<html>home</html>');
  });

  // The whole point of the rewrite: trailingSlash 'never' URLs must answer 200.
  it('resolves a canonical post URL to its index without a redirect', async () => {
    const bucket = fakeBucket(BUILD);
    const res = await worker.fetch(
      get('/posts/some-slug'),
      { ASSETS: bucket },
      ctx
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('<html>post</html>');
    expect(bucket.reads).toEqual([
      'posts/some-slug',
      'posts/some-slug/index.html',
    ]);
  });

  it('answers a missing page with the 404 page and a 404 status', async () => {
    const bucket = fakeBucket(BUILD);
    const res = await worker.fetch(
      get('/no-such-page'),
      { ASSETS: bucket },
      ctx
    );

    expect(res.status).toBe(404);
    expect(await res.text()).toBe('<html>not found</html>');
  });

  it('serves /feed from the built rss.xml', async () => {
    const bucket = fakeBucket(BUILD);
    const res = await worker.fetch(get('/feed'), { ASSETS: bucket }, ctx);

    expect(res.status).toBe(200);
    expect(bucket.reads).toEqual(['rss.xml']);
  });
});

describe('response headers', () => {
  it('sets the RFC 8288 relations and the security block on every asset', async () => {
    const bucket = fakeBucket(BUILD);
    const res = await worker.fetch(get('/'), { ASSETS: bucket }, ctx);

    expect(res.headers.get('Link')).toBe(LINK_HEADER);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin'
    );
    expect(res.headers.get('Vary')).toBe('Accept, Accept-Encoding');
  });

  it('overrides the stored type on the RFC 9727 linkset and adds CORS', async () => {
    const bucket = fakeBucket(BUILD);
    const res = await worker.fetch(
      get('/.well-known/api-catalog'),
      { ASSETS: bucket },
      ctx
    );

    expect(res.headers.get('Content-Type')).toBe(LINKSET_CONTENT_TYPE);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('serves the agent card as application/json with CORS', async () => {
    const bucket = fakeBucket(BUILD);
    const res = await worker.fetch(
      get('/.well-known/agent-card.json'),
      { ASSETS: bucket },
      ctx
    );

    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('marks hashed chunks immutable and revalidates HTML', async () => {
    const bucket = fakeBucket(BUILD);
    const asset = await worker.fetch(
      get('/_astro/app.abc123.css'),
      { ASSETS: bucket },
      ctx
    );
    const page = await worker.fetch(get('/'), { ASSETS: bucket }, ctx);

    expect(asset.headers.get('Cache-Control')).toBe(
      'public, max-age=31536000, immutable'
    );
    expect(page.headers.get('Cache-Control')).toContain('must-revalidate');
  });

  it('exposes an ETag so conditional requests can work', async () => {
    const bucket = fakeBucket(BUILD);
    const res = await worker.fetch(get('/'), { ASSETS: bucket }, ctx);

    expect(res.headers.get('ETag')).toBe('"etag-index.html"');
  });
});

describe('the origin keeps everything it owns', () => {
  it('passes WordPress through untouched', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('wp', { status: 200 }));
    const bucket = fakeBucket(BUILD);

    const res = await worker.fetch(
      get('/wp-json/wp/v2/posts'),
      { ASSETS: bucket },
      ctx
    );

    expect(await res.text()).toBe('wp');
    expect(bucket.reads).toEqual([]);
    fetchSpy.mockRestore();
  });

  it('passes a markdown negotiation through so markdown.php answers it', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('# post', { status: 200 }));
    const bucket = fakeBucket(BUILD);

    const res = await worker.fetch(
      get('/posts/some-slug', { headers: { Accept: 'text/markdown' } }),
      { ASSETS: bucket },
      ctx
    );

    expect(await res.text()).toBe('# post');
    expect(bucket.reads).toEqual([]);
    fetchSpy.mockRestore();
  });

  it('refuses sensitive paths without touching the bucket', async () => {
    const bucket = fakeBucket(BUILD);
    const res = await worker.fetch(get('/.env'), { ASSETS: bucket }, ctx);

    expect(res.status).toBe(403);
    expect(bucket.reads).toEqual([]);
  });
});

describe('legacy WordPress permalinks', () => {
  it('301s to the canonical URL once the target is confirmed', async () => {
    const bucket = fakeBucket(BUILD);
    const res = await worker.fetch(
      get('/2015/07/some-slug/'),
      { ASSETS: bucket },
      ctx
    );

    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('/posts/some-slug');
    expect(bucket.reads).toEqual(['HEAD posts/some-slug/index.html']);
  });

  // The whole point of the confirmation step.
  it('404s rather than redirecting to a post that no longer exists', async () => {
    const bucket = fakeBucket(BUILD);
    const res = await worker.fetch(
      get('/2015/07/deleted-years-ago/'),
      { ASSETS: bucket },
      ctx
    );

    expect(res.status).toBe(404);
    expect(res.headers.get('Location')).toBeNull();
    expect(await res.text()).toBe('<html>not found</html>');
  });

  it('carries the query string across', async () => {
    const bucket = fakeBucket(BUILD);
    const res = await worker.fetch(
      get('/2015/07/some-slug/?utm_source=newsletter'),
      { ASSETS: bucket },
      ctx
    );

    expect(res.headers.get('Location')).toBe(
      '/posts/some-slug?utm_source=newsletter'
    );
  });

  it('keeps the security headers on the redirect itself', async () => {
    const bucket = fakeBucket(BUILD);
    const res = await worker.fetch(
      get('/2015/07/some-slug'),
      { ASSETS: bucket },
      ctx
    );

    expect(res.status).toBe(301);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
  });
});
