import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  COMMENTS_CACHE_CONTROL,
  LINK_HEADER,
  LINKSET_CONTENT_TYPE,
  SECURITY_HEADERS,
  assetCandidates,
  cacheControlForKey,
  contentTypeForKey,
  forcedContentType,
  isCacheableCommentsRequest,
  isJetpackCallback,
  route,
  wantsMarkdown,
} from '../workers/edge-router/src/router';

const BASE = 'https://www.computerjy.com';

function decide(path: string, method = 'GET', accept: string | null = null) {
  return route(new URL(path, BASE), method, accept);
}

describe('WordPress and PHP stay on the origin', () => {
  it.each([
    '/wp-json/wp/v2/posts',
    '/wp-json',
    '/wp-admin',
    '/wp-admin/edit.php',
    '/wp-includes/js/jquery.js',
    '/wp-content/uploads/2024/cover.jpg',
  ])('routes %s to the origin', (path) => {
    expect(decide(path)).toEqual({ kind: 'origin', reason: 'wordpress' });
  });

  it.each(['/wp-login.php', '/xmlrpc.php', '/markdown.php'])(
    'executes %s at the origin rather than serving it from R2',
    (path) => {
      expect(decide(path)).toEqual({ kind: 'origin', reason: 'php' });
    }
  );

  // markdown.php ships inside dist/ and therefore lands in the bucket. Serving
  // it as an object would publish its source.
  it('never resolves a .php path to an R2 key', () => {
    const decision = decide('/markdown.php');
    expect(decision.kind).not.toBe('asset');
  });

  it('does not mistake a lookalike prefix for a WordPress path', () => {
    expect(decide('/wp-jsonp-thing').kind).toBe('asset');
    expect(decide('/posts/wp-admin-explained').kind).toBe('asset');
  });

  it('sends writes to the origin so comment POSTs keep working', () => {
    expect(decide('/wp-json/wp/v2/comments', 'POST')).toEqual({
      kind: 'origin',
      reason: 'wordpress',
    });
    expect(decide('/anything', 'POST')).toEqual({
      kind: 'origin',
      reason: 'method',
    });
  });
});

describe('blocked files', () => {
  it.each([
    '/.env',
    '/.env.example',
    '/.git/config',
    '/wp-config.php',
    '/readme.html',
    '/license.txt',
  ])('refuses %s', (path) => {
    expect(decide(path)).toEqual({ kind: 'forbidden' });
  });

  it('blocks by basename anywhere in the tree, as FilesMatch does', () => {
    expect(decide('/posts/some-slug/.env')).toEqual({ kind: 'forbidden' });
  });

  it('does not block ordinary files that merely contain the words', () => {
    expect(decide('/posts/my-license.txt').kind).toBe('asset');
  });
});

describe('markdown content negotiation', () => {
  it('detects the header case-insensitively, as the [NC] flag does', () => {
    expect(wantsMarkdown('text/markdown')).toBe(true);
    expect(wantsMarkdown('TEXT/MARKDOWN, text/html;q=0.9')).toBe(true);
    expect(wantsMarkdown('text/html')).toBe(false);
    expect(wantsMarkdown(null)).toBe(false);
  });

  it('forwards the original URL so markdown.php still sees REQUEST_URI', () => {
    expect(decide('/posts/some-slug', 'GET', 'text/markdown')).toEqual({
      kind: 'origin',
      reason: 'markdown',
    });
  });

  // The origin's own rewrite checks for a real file before delegating, so
  // /auth.md is not shadowed by the converter.
  it('leaves the real-file guard to the origin', () => {
    expect(decide('/auth.md', 'GET', 'text/markdown').kind).toBe('origin');
  });

  it('never diverts WordPress paths to the converter', () => {
    expect(decide('/wp-json/wp/v2/posts', 'GET', 'text/markdown')).toEqual({
      kind: 'origin',
      reason: 'wordpress',
    });
  });
});

describe('trailingSlash: never resolves without a redirect', () => {
  it('serves the root index', () => {
    expect(assetCandidates('/')).toEqual(['index.html']);
  });

  it('tries the literal object before the directory index', () => {
    expect(assetCandidates('/posts/some-slug')).toEqual([
      'posts/some-slug',
      'posts/some-slug/index.html',
    ]);
  });

  it('resolves an explicitly slashed path to its index', () => {
    expect(assetCandidates('/posts/some-slug/')).toEqual([
      'posts/some-slug/index.html',
    ]);
  });

  it('keeps file paths literal', () => {
    expect(assetCandidates('/_astro/index.abc123.css')).toEqual([
      '_astro/index.abc123.css',
      '_astro/index.abc123.css/index.html',
    ]);
  });

  it('decodes percent-encoding into the real key', () => {
    expect(assetCandidates('/posts/a%20b')).toEqual([
      'posts/a b',
      'posts/a b/index.html',
    ]);
  });

  it.each(['/../secret', '/posts/../../etc/passwd', '/a/%2e%2e/b'])(
    'refuses to build a key for %s',
    (path) => {
      expect(assetCandidates(path)).toBeNull();
    }
  );

  it('refuses malformed percent-encoding', () => {
    expect(assetCandidates('/posts/%zz')).toBeNull();
  });

  it('collapses redundant separators the way a filesystem walk would', () => {
    expect(assetCandidates('/posts//some-slug')).toEqual([
      'posts/some-slug',
      'posts/some-slug/index.html',
    ]);
  });
});

describe('single-file aliases', () => {
  it('maps /feed to the built feed', () => {
    expect(decide('/feed')).toEqual({ kind: 'asset', candidates: ['rss.xml'] });
    expect(decide('/feed/')).toEqual({
      kind: 'asset',
      candidates: ['rss.xml'],
    });
  });

  it('maps /sitemap.xml to the sitemap index', () => {
    expect(decide('/sitemap.xml')).toEqual({
      kind: 'asset',
      candidates: ['sitemap-index.xml'],
    });
  });

  it('leaves the generated sitemap parts alone', () => {
    expect(decide('/sitemap-0.xml')).toEqual({
      kind: 'asset',
      candidates: ['sitemap-0.xml', 'sitemap-0.xml/index.html'],
    });
  });
});

describe('discovery content types', () => {
  it('forces the RFC 9727 linkset profile with CORS', () => {
    expect(forcedContentType('/.well-known/api-catalog')).toEqual({
      type: LINKSET_CONTENT_TYPE,
      cors: true,
    });
  });

  it.each([
    '/.well-known/openid-configuration',
    '/.well-known/oauth-authorization-server',
    '/.well-known/oauth-protected-resource',
    '/.well-known/ai-catalog.json',
    '/.well-known/mcp/server-card.json',
    '/.well-known/agent-skills/index.json',
    '/.well-known/agent-card.json',
    '/.well-known/a2a.json',
  ])('serves %s as application/json with CORS', (path) => {
    expect(forcedContentType(path)).toEqual({
      type: 'application/json',
      cors: true,
    });
  });

  it('leaves everything else to R2 and the extension map', () => {
    expect(forcedContentType('/.well-known/jwks.json')).toBeNull();
    expect(forcedContentType('/index.html')).toBeNull();
  });

  it('types the extensionless discovery documents from R2 metadata only', () => {
    // R2 has no useful type for these, which is exactly why forcedContentType exists.
    expect(contentTypeForKey('.well-known/api-catalog')).toBe(
      'application/octet-stream'
    );
    expect(contentTypeForKey('auth.md')).toBe('text/markdown; charset=utf-8');
    expect(contentTypeForKey('index.html')).toBe('text/html; charset=utf-8');
    expect(contentTypeForKey('site.webmanifest')).toBe(
      'application/manifest+json'
    );
  });
});

describe('cache policy', () => {
  it('marks content-hashed chunks immutable', () => {
    expect(cacheControlForKey('_astro/index.abc123.css')).toBe(
      'public, max-age=31536000, immutable'
    );
  });

  it('revalidates documents a rebuild replaces in place', () => {
    for (const key of [
      'index.html',
      'posts/some-slug/index.html',
      'rss.xml',
      'sitemap-index.xml',
      'search-index.json',
    ]) {
      expect(cacheControlForKey(key)).toContain('must-revalidate');
    }
  });

  it('keeps the mod_expires ttls for the rest', () => {
    expect(cacheControlForKey('logo.svg')).toBe('public, max-age=2592000');
    expect(cacheControlForKey('auth.md')).toBe('public, max-age=3600');
    expect(cacheControlForKey('.well-known/api-catalog')).toBe(
      'public, max-age=86400'
    );
    expect(cacheControlForKey('agent-card.json')).toBe('public, max-age=86400');
  });
});

describe("Jetpack's server-to-server channel", () => {
  // WordPress.com calls back to the site ROOT, not an aliased path. Before this
  // rule those requests were answered from the bucket, so WordPress.com read the
  // static homepage as a reply and reported "site is not connected".
  it.each([
    '/?for=jetpack&jetpack=comms&token=abc&signature=def',
    '/?rest_route=%2Fjetpack%2Fv4%2Fsync%2Fstatus&_for=jetpack&token=abc',
  ])('sends %s to the origin on GET', (path) => {
    const decision = decide(path);
    expect(decision.kind).toBe('origin');
    expect(decision.kind === 'origin' && decision.reason).toBe('jetpack');
  });

  it('sends the comms POST to the origin', () => {
    expect(decide('/?for=jetpack&jetpack=comms', 'POST').kind).toBe('origin');
  });

  // The handler compares $_GET['for'] === 'jetpack' exactly, so the edge must
  // not be laxer than the thing it fronts.
  it.each([
    '/?for=Jetpack',
    '/?for=jetpackx',
    '/?forr=jetpack',
    '/?notfor=jetpack',
  ])('does not divert %s', (path) => {
    expect(isJetpackCallback(new URL(path, BASE), '/')).toBe(false);
  });

  // Only the root carries this channel; a slug with the same query is content.
  it('only applies at the site root', () => {
    expect(decide('/posts/some-slug?for=jetpack').kind).toBe('asset');
  });

  it('still serves the plain homepage from the bucket', () => {
    expect(decide('/').kind).toBe('asset');
  });
});

describe('parity with the production vhost', () => {
  const vhost = readFileSync('deploy/lightsail-apache.conf', 'utf8');

  // The Link header is the discovery layer's contract (RFC 8288 / RFC 9727).
  // If the vhost's copy is edited without editing the Worker's, agents get two
  // different answers depending on which one served the request.
  it('emits the same Link header the vhost does', () => {
    const match = vhost.match(/Header always set Link '([^']+)'/);
    expect(match).not.toBeNull();
    expect(LINK_HEADER).toBe(match?.[1]);
  });

  it.each(Object.entries(SECURITY_HEADERS).filter(([n]) => n !== 'Link'))(
    'emits %s exactly as the vhost sets it',
    (name, value) => {
      expect(vhost).toContain(`Header always set ${name} "${value}"`);
    }
  );

  // Both of these route a WordPress entry point that lives at the site root.
  // Drop either from the vhost and the Worker would keep sending traffic to an
  // origin that no longer answers it.
  it('keeps the Jetpack root rewrite the Worker mirrors', () => {
    expect(vhost).toContain(
      'RewriteCond %{QUERY_STRING} (^|&)_?for=jetpack(&|$)'
    );
    expect(vhost).toMatch(
      /RewriteRule \^\/\?\$ \/var\/www\/wordpress\/index\.php \[L,QSA\]/
    );
  });

  it('keeps wp-cron.php aliased into WordPress', () => {
    expect(vhost).toContain(
      'Alias /wp-cron.php /var/www/wordpress/wp-cron.php'
    );
  });
});

describe('legacy WordPress permalinks', () => {
  it.each([
    ['/2015/07/clickbait-headlines/', 'clickbait-headlines'],
    ['/2015/07/clickbait-headlines', 'clickbait-headlines'],
    // WordPress's day-and-name structure, in case it was ever the setting.
    ['/2015/07/27/clickbait-headlines/', 'clickbait-headlines'],
  ])('redirects %s to the canonical post URL', (path, slug) => {
    expect(decide(path)).toEqual({
      kind: 'redirect',
      location: `/posts/${slug}`,
      verifyKey: `posts/${slug}/index.html`,
    });
  });

  // Otherwise a dead link becomes a redirect into a 404, which is worse.
  it('names the key the handler must confirm before redirecting', () => {
    const decision = decide('/2015/07/gone-for-good/');
    expect(decision).toMatchObject({
      verifyKey: 'posts/gone-for-good/index.html',
    });
  });

  it('points an agent at the canonical URL instead of the origin', () => {
    expect(
      decide('/2015/07/clickbait-headlines/', 'GET', 'text/markdown').kind
    ).toBe('redirect');
  });

  it.each([
    '/posts/clickbait-headlines',
    '/2015/07/', // a date archive, which the static site has no equivalent for
    '/2015/',
    '/20155/07/something',
    '/2015/7/something',
    '/2015/07/nested/deeper/slug',
  ])('leaves %s alone', (path) => {
    expect(decide(path).kind).not.toBe('redirect');
  });

  // A four-digit-bounded year keeps a real slug starting with digits safe.
  it('does not swallow a post whose slug begins with digits', () => {
    expect(decide('/posts/101-greatest-george-carlin-quotes').kind).toBe(
      'asset'
    );
  });

  it('never overrides the WordPress or blocked-file rules', () => {
    expect(decide('/wp-content/2015/07/image.jpg').kind).toBe('origin');
    expect(decide('/2015/07/.env').kind).toBe('forbidden');
  });

  it('refuses a slug carrying an encoded separator', () => {
    expect(decide('/2015/07/a%2F..%2Fetc/').kind).not.toBe('redirect');
  });
});

describe('comments endpoint edge cache', () => {
  it('caches GETs of the comments collection', () => {
    expect(
      isCacheableCommentsRequest(
        new URL('/wp-json/wp/v2/comments?post=13213', BASE),
        'GET'
      )
    ).toBe(true);
  });

  it('never caches a write', () => {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      expect(
        isCacheableCommentsRequest(
          new URL('/wp-json/wp/v2/comments', BASE),
          method
        )
      ).toBe(false);
    }
  });

  it('leaves the rest of the REST API alone', () => {
    for (const path of [
      '/wp-json/wp/v2/posts',
      '/wp-json/wp/v2/comments/816',
      '/wp-json/',
      '/wp-admin/',
    ]) {
      expect(isCacheableCommentsRequest(new URL(path, BASE), 'GET')).toBe(
        false
      );
    }
  });

  it('holds comments for a minute at the edge only', () => {
    expect(COMMENTS_CACHE_CONTROL).toBe('public, max-age=0, s-maxage=60');
  });
});
