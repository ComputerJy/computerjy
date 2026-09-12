import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const vhost = readFileSync('deploy/lightsail-apache.conf', 'utf8');

describe('deploy/lightsail-apache.conf serves WordPress', () => {
  it('points the DocumentRoot at WordPress', () => {
    expect(vhost).toMatch(/^\s*DocumentRoot \/var\/www\/wordpress\s*$/m);
  });

  it('no longer references the Astro build directory', () => {
    expect(vhost).not.toContain('computerjy_dist');
  });

  it('redirects the Astro feed URL to the WordPress feed', () => {
    expect(vhost).toContain('RewriteRule ^/rss\\.xml$ /feed [R=301,L]');
  });

  it('redirects both Astro sitemap URLs to the Yoast sitemap index', () => {
    // Yoast SEO owns sitemaps on this install. Swapping the SEO plugin means
    // changing this target (core's is /wp-sitemap.xml), SITEMAP in
    // scripts/check-urls.sh, and this assertion together.
    expect(vhost).toContain(
      'RewriteRule ^/sitemap(-index)?\\.xml$ /sitemap_index.xml [R=301,L]'
    );
  });

  it('keeps markdown negotiation behind the real-file guard', () => {
    const guard = vhost.indexOf(
      'RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -f'
    );
    const markdown = vhost.indexOf(
      'RewriteCond %{HTTP:Accept} text/markdown [NC]'
    );
    expect(guard).toBeGreaterThan(-1);
    expect(markdown).toBeGreaterThan(guard);
  });

  it('ends the request after the markdown rewrite so W3TC .htaccess rules never run', () => {
    expect(vhost).toContain('RewriteRule ^(.*)$ /markdown.php [END,QSA]');
  });

  it('sets the edge cache header only for anonymous HTML reads', () => {
    const line = vhost.split('\n').find((l) => l.includes('s-maxage=3600'));
    expect(line).toBeDefined();
    expect(line).toContain('%{CONTENT_TYPE} =~ m#^text/html#');
    expect(line).toContain("%{REQUEST_METHOD} in {'GET','HEAD'}");
    expect(line).toContain('wordpress_logged_in_');
    expect(line).toContain('wp-postpass_');
    expect(line).toContain('comment_author_');
    expect(line).toContain('%{REQUEST_STATUS} == 200');
  });

  it('never lets mod_expires touch generated HTML or JSON', () => {
    expect(vhost).not.toMatch(
      /ExpiresByType (text\/html|application\/json|text\/markdown)/
    );
  });

  it('scopes every ExpiresDefault to a <FilesMatch> so generated HTML is never stamped', () => {
    // A bare ExpiresDefault at <Directory> level would apply to every
    // response, HTML and /wp-json included, and the ExpiresByType check
    // above would not notice.
    let depth = 0;
    for (const line of vhost.split('\n')) {
      if (/^\s*<FilesMatch\b/.test(line)) depth++;
      if (/^\s*<\/FilesMatch>/.test(line)) depth--;
      if (/^\s*ExpiresDefault\b/.test(line))
        expect(depth, line.trim()).toBeGreaterThan(0);
    }
  });

  it('does not fall back to a static 404 page', () => {
    expect(vhost).not.toContain('ErrorDocument 404');
  });
});

describe('legacy /YYYY/MM/<slug> redirect (moved from the Worker)', () => {
  const match = vhost.match(
    /RewriteRule (\^\/\\d\{4\}\S+) \/posts\/\$1 \[R=301,L\]/
  );
  // No '$^' fallback: when the rule is missing, `pattern` is null and every
  // case below fails on the assertion instead of passing vacuously.
  const pattern = match ? new RegExp(match[1]) : null;

  it('exists', () => {
    expect(pattern).not.toBeNull();
  });

  it.each([
    ['/2008/01/1goal', '1goal'],
    ['/2008/01/1goal/', '1goal'],
    ['/2008/01/15/1goal', '1goal'],
    ['/2010/12/some-long-slug-with-numbers-2', 'some-long-slug-with-numbers-2'],
  ])('%s → /posts/%s', (path, slug) => {
    expect(pattern).not.toBeNull();
    const m = pattern!.exec(path);
    expect(m?.[1]).toBe(slug);
  });

  it.each([
    '/posts/2008-review',
    '/20081/01/x',
    '/2008/1/x',
    '/2008/01',
    '/category/2008/01/x',
    // Bare day archives: the last segment is the day, not a slug, so they
    // must not become /posts/15 (a guaranteed 404). WordPress answers them.
    '/2008/01/15/',
    '/2008/01/15',
  ])('leaves %s alone', (path) => {
    expect(pattern).not.toBeNull();
    expect(pattern!.test(path)).toBe(false);
  });
});
