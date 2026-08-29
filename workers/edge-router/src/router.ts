/**
 * Pure routing decisions for the ComputerJy edge Worker.
 *
 * Everything in this file is a plain function over a URL, a method and an
 * Accept header — no R2, no fetch, no Cloudflare globals — so the whole
 * routing table is unit-testable (`tests/edge-router.test.ts`) without
 * deploying anything.
 *
 * The rules here are a port of `deploy/lightsail-apache.conf`, which is the
 * production vhost. When that file changes, this one changes with it; the
 * parity matrix in `deploy/cloudflare-r2.md` records every place they
 * deliberately differ.
 */

/** RFC 8288 / RFC 9727 relations, byte-identical to the Apache `Header always set Link`. */
export const LINK_HEADER =
  '</.well-known/api-catalog>; rel="api-catalog", ' +
  '</api/openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json;version=3.0", ' +
  '<https://developer.wordpress.org/rest-api/>; rel="service-doc"; type="text/html", ' +
  '</search-index.json>; rel="describedby"; type="application/json", ' +
  '</.well-known/ai-catalog.json>; rel="ai-catalog"; type="application/json"';

/** The `Header always set` block of the vhost. */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  Link: LINK_HEADER,
  Vary: 'Accept, Accept-Encoding',
};

/**
 * Apache: `<FilesMatch "^(\.git|\.env|wp-config\.php|readme\.html|license\.txt)">`.
 * Unanchored at the end on purpose — `.env.example` and `.gitignore` are blocked too.
 *
 * Applied to every path segment rather than only the final one, so `/.git/config`
 * is refused as well. `FilesMatch` inspects just the basename and would let that
 * through; on Apache the directory never exists under the webroot, but an object
 * store has no directories to be absent, so the check is widened here.
 */
const BLOCKED_SEGMENT =
  /^(\.git|\.env|wp-config\.php|readme\.html|license\.txt)/;

/**
 * Apache `Alias` targets outside the Astro DocumentRoot. `/wp-json` is a
 * RewriteRule rather than an Alias but routes to the same place.
 */
const WORDPRESS_PREFIXES = [
  '/wp-json',
  '/wp-admin',
  '/wp-includes',
  '/wp-content',
];

/** `<Location "/.well-known/api-catalog">` — RFC 9727 linkset. */
const API_CATALOG_PATH = '/.well-known/api-catalog';

export const LINKSET_CONTENT_TYPE =
  'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';

/** The `<LocationMatch>` list of JSON discovery documents that also get CORS. */
const WELL_KNOWN_JSON =
  /^\/\.well-known\/(openid-configuration|oauth-authorization-server|oauth-protected-resource|ai-catalog\.json|mcp\/server-card\.json|agent-skills\/index\.json|agent-card\.json|a2a\.json)$/;

/**
 * WordPress served this site at `/YYYY/MM/<slug>` (with an optional day
 * segment) for a decade before the Astro migration moved every post to
 * `/posts/<slug>`. Those are the URLs a decade of inbound links point at, and
 * WordPress's own canonical redirect cannot rescue them: date paths are not in
 * the pass-through list, so WordPress never sees the request.
 *
 * The year is bounded to four digits and the month and day to two, so a real
 * post whose slug happens to start with digits cannot be swallowed by this.
 */
const LEGACY_PERMALINK = /^\/(\d{4})\/(\d{2})(?:\/(\d{2}))?\/([^/]+)\/?$/;

/**
 * Apache `Alias /feed …/rss.xml` and `Alias /sitemap.xml …/sitemap-index.xml`.
 * Both point at a single file, so only the exact path (with or without a
 * trailing slash) resolves.
 */
const PATH_ALIASES: Readonly<Record<string, string>> = {
  '/feed': 'rss.xml',
  '/feed/': 'rss.xml',
  '/sitemap.xml': 'sitemap-index.xml',
};

/**
 * `origin` means "hand the request to Lightsail untouched". The Worker reaches
 * the origin by re-fetching the same URL: a Worker subrequest to a route the
 * same Worker handles is not re-dispatched to that Worker, so it lands on the
 * origin server. That is also why no hostname or IP for the origin appears in
 * this repo.
 */
export type RouteDecision =
  | { kind: 'origin'; reason: OriginReason }
  | { kind: 'forbidden' }
  | { kind: 'asset'; candidates: string[] }
  /**
   * A permanent move to `location`, but only once `verifyKey` is confirmed to
   * exist. Redirecting an unknown slug would turn one 404 into a redirect into
   * another 404, which is worse for both crawlers and readers.
   */
  | { kind: 'redirect'; location: string; verifyKey: string };

export type OriginReason =
  'wordpress' | 'php' | 'markdown' | 'method' | 'unmapped';

/** Case-insensitive `Accept: text/markdown`, matching Apache's `[NC]` flag. */
export function wantsMarkdown(accept: string | null): boolean {
  return accept !== null && /text\/markdown/i.test(accept);
}

function isWordPressPath(pathname: string): boolean {
  return WORDPRESS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Resolves a URL path to the R2 keys to try, in order.
 *
 * Apache tries the literal file first, then rewrites `/path` to
 * `/path/index.html` when `/path` is a directory holding one — that internal
 * rewrite is what lets `trailingSlash: 'never'` URLs answer 200 instead of
 * redirecting. Returns null for anything that cannot be a safe key.
 */
export function assetCandidates(pathname: string): string[] | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\0') || !decoded.startsWith('/')) return null;

  const hadTrailingSlash = decoded.length > 1 && decoded.endsWith('/');
  const segments = decoded.split('/').filter((s) => s !== '' && s !== '.');
  if (segments.some((s) => s === '..')) return null;

  if (segments.length === 0) return ['index.html'];

  const base = segments.join('/');
  return hadTrailingSlash
    ? [`${base}/index.html`]
    : [base, `${base}/index.html`];
}

/**
 * The routing table, in the same order the vhost evaluates its rules.
 */
export function route(
  url: URL,
  method: string,
  accept: string | null
): RouteDecision {
  const pathname = url.pathname;

  // 1. Hidden and sensitive files, blocked everywhere the vhost blocks them.
  if (pathname.split('/').some((segment) => BLOCKED_SEGMENT.test(segment))) {
    return { kind: 'forbidden' };
  }

  // 2. WordPress admin, includes, uploads and REST API.
  if (isWordPressPath(pathname)) return { kind: 'origin', reason: 'wordpress' };

  // 3. Anything else PHP is executed by the origin. This also keeps
  //    `markdown.php` — which ships inside `dist/` — from ever being served as
  //    source text out of the bucket.
  if (pathname.endsWith('.php')) return { kind: 'origin', reason: 'php' };

  // 4. R2 only answers reads; everything else (comment POSTs, admin forms) is
  //    the origin's business.
  if (method !== 'GET' && method !== 'HEAD') {
    return { kind: 'origin', reason: 'method' };
  }

  // 5. Legacy WordPress permalinks. Ahead of markdown negotiation so an agent
  //    asking for text/markdown is pointed at the canonical URL rather than
  //    handed a 404 by the origin.
  const legacy = LEGACY_PERMALINK.exec(pathname);
  if (legacy !== null) {
    const rawSlug = legacy[4];
    let slug: string;
    try {
      slug = decodeURIComponent(rawSlug);
    } catch {
      return { kind: 'origin', reason: 'unmapped' };
    }
    // %2F and friends could otherwise smuggle a separator into the key.
    if (
      !slug.includes('/') &&
      !slug.includes('\0') &&
      slug !== '.' &&
      slug !== '..'
    ) {
      return {
        kind: 'redirect',
        // Built from the still-encoded segment: the Location header must not
        // carry anything the URL parser has already normalised away.
        location: `/posts/${rawSlug}`,
        verifyKey: `posts/${slug}/index.html`,
      };
    }
  }

  // 6. Markdown content negotiation. The origin's rewrite already checks for a
  //    real file before delegating to markdown.php, so forwarding the original
  //    URL preserves both the `-f` guard and markdown.php's `REQUEST_URI`.
  if (wantsMarkdown(accept)) return { kind: 'origin', reason: 'markdown' };

  // 7. Single-file aliases.
  const alias = PATH_ALIASES[pathname];
  if (alias !== undefined) return { kind: 'asset', candidates: [alias] };

  // 8. Static build, served from R2.
  const candidates = assetCandidates(pathname);
  if (candidates === null) return { kind: 'origin', reason: 'unmapped' };
  return { kind: 'asset', candidates };
}

/**
 * Content types the vhost forces regardless of what is on disk, plus the CORS
 * they carry. R2 stores no useful type for extensionless keys, so these are
 * what make `/.well-known/api-catalog` and friends correct at the edge.
 */
export function forcedContentType(
  pathname: string
): { type: string; cors: boolean } | null {
  if (pathname === API_CATALOG_PATH) {
    return { type: LINKSET_CONTENT_TYPE, cors: true };
  }
  if (WELL_KNOWN_JSON.test(pathname)) {
    return { type: 'application/json', cors: true };
  }
  return null;
}

const EXTENSION_TYPES: Readonly<Record<string, string>> = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  json: 'application/json',
  webmanifest: 'application/manifest+json',
  xml: 'application/xml',
  txt: 'text/plain; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  avif: 'image/avif',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  ico: 'image/x-icon',
  woff2: 'font/woff2',
};

function extensionOf(key: string): string {
  const basename = key.slice(key.lastIndexOf('/') + 1);
  const dot = basename.lastIndexOf('.');
  return dot === -1 ? '' : basename.slice(dot + 1).toLowerCase();
}

/** Falls back to the extension when R2 has no stored content type. */
export function contentTypeForKey(key: string): string {
  return EXTENSION_TYPES[extensionOf(key)] ?? 'application/octet-stream';
}

/**
 * Mirrors the vhost's `mod_expires` table, with two deliberate additions:
 * `_astro/*` is immutable (the filenames are content-hashed), and the
 * documents a rebuild replaces in place — HTML, the feeds, the sitemaps and
 * the search index — are revalidated rather than held for a day. `s-maxage`
 * lets the edge keep HTML between deploys; the deploy purges it.
 */
export function cacheControlForKey(key: string): string {
  if (key.startsWith('_astro/')) {
    return 'public, max-age=31536000, immutable';
  }

  const ext = extensionOf(key);

  if (ext === 'html' || ext === 'xml' || key === 'search-index.json') {
    return 'public, max-age=0, must-revalidate, s-maxage=3600';
  }
  if (ext === 'css' || ext === 'js' || ext === 'mjs' || ext === 'woff2') {
    return 'public, max-age=31536000';
  }
  if (
    ext === 'svg' ||
    ext === 'webp' ||
    ext === 'avif' ||
    ext === 'png' ||
    ext === 'jpg' ||
    ext === 'jpeg' ||
    ext === 'gif' ||
    ext === 'ico'
  ) {
    return 'public, max-age=2592000';
  }
  if (ext === 'md') {
    return 'public, max-age=3600';
  }
  // JSON, the extensionless well-known documents and everything else.
  return 'public, max-age=86400';
}
