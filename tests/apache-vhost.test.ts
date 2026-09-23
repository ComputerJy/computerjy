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

  it('redirects the Astro and Yoast sitemap indexes to the Jetpack sitemap', () => {
    // Jetpack SEO owns sitemaps at /sitemap.xml; SITEMAP in
    // scripts/check-urls.sh names the same URL.
    expect(vhost).toContain(
      'RewriteRule ^/sitemap[-_]index\\.xml$ /sitemap.xml [R=301,L]'
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

describe('legacy permalinks', () => {
  it('are left to WordPress (inc/seo.php), not rewritten to /posts/', () => {
    // Permalinks are /YYYY/MM/<slug>/ now; the old /YYYY/MM/<slug> -> /posts/
    // rule would loop every post.
    expect(vhost).not.toContain('/posts/$1');
  });
});
