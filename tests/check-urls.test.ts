// tests/check-urls.test.ts
import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const script = 'scripts/check-urls.sh';

describe('scripts/check-urls.sh', () => {
  it('is executable bash that passes shellcheck-level syntax (bash -n)', () => {
    expect(() => execFileSync('bash', ['-n', script])).not.toThrow();
  });

  it('checks every slug in scripts/known-slugs.json, not a sample', () => {
    const slugs: string[] = JSON.parse(
      readFileSync('scripts/known-slugs.json', 'utf8')
    );
    // --print-urls lists the URLs it would request without hitting the network.
    const out = execFileSync('bash', [script, '--print-urls'], {
      encoding: 'utf8',
    });
    for (const slug of slugs) expect(out).toContain(`/posts/${slug}\n`);
  });

  it('encodes the Astro-era shapes for both modes', () => {
    const astro = execFileSync('bash', [script, '--print-urls'], {
      encoding: 'utf8',
      env: { ...process.env, MODE: 'astro' },
    });
    const wp = execFileSync('bash', [script, '--print-urls'], {
      encoding: 'utf8',
      env: { ...process.env, MODE: 'wordpress' },
    });
    expect(astro).toContain('/rss.xml 200');
    expect(wp).toContain('/rss.xml 301 https://www.computerjy.com/feed');
    expect(wp).toContain('/category/entertainment 200');
    expect(wp).toContain('/tag/linux 200');
    expect(wp).toContain('/privacy-policy 200');
    expect(wp).toContain(
      '/2008/01/1goal 301 https://www.computerjy.com/posts/1goal'
    );
  });
});

describe('scripts/check-urls.sh live slug paging', () => {
  // 127.0.0.1:1 (tcpmux) is never listening: every curl fails fast with
  // "connection refused" and nothing leaves the machine.
  it('reports a failed REST page as a FAIL and still exits 1 at the end', () => {
    const result = spawnSync('bash', [script, 'http://127.0.0.1:1'], {
      encoding: 'utf8',
      env: { ...process.env, LIVE_SLUGS: '1', CONNECT_TO: '' },
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(
      /^FAIL \/wp-json\/wp\/v2\/posts\?per_page=100&page=1&_fields=slug curl exit 7/m
    );
    expect(result.stdout).toMatch(/CHECK\(S\) FAILED$/m);
  });

  it('still checks every known slug when live paging fails', () => {
    const slugs: string[] = JSON.parse(
      readFileSync('scripts/known-slugs.json', 'utf8')
    );
    const result = spawnSync('bash', [script, 'http://127.0.0.1:1'], {
      encoding: 'utf8',
      env: { ...process.env, LIVE_SLUGS: '1', CONNECT_TO: '' },
    });
    const section = result.stdout.split('== every post slug ==')[1] ?? '';
    const slugFails = section
      .split('\n')
      .filter((l) => l.startsWith('FAIL /posts/'));
    expect(slugFails).toHaveLength(new Set(slugs).size);
  });
});

describe('scripts/check-urls.sh EDGE=1 (Cloudflare cache matrix)', () => {
  const run = (env: Record<string, string>) =>
    spawnSync('bash', [script, 'http://127.0.0.1:1'], {
      encoding: 'utf8',
      env: { ...process.env, LIVE_SLUGS: '0', ...env },
    });

  it('is skipped under CONNECT_TO, which bypasses Cloudflare', () => {
    const out = run({
      EDGE: '1',
      CONNECT_TO: 'www.computerjy.com:443:127.0.0.1:1',
    }).stdout;
    expect(out).toContain('== edge cache: skipped');
    expect(out).not.toMatch(/^FAIL edge/m);
  });

  it('is off unless EDGE=1', () => {
    expect(run({ EDGE: '', CONNECT_TO: '' }).stdout).not.toContain(
      '== edge cache'
    );
  });

  it('asserts every row of the matrix and counts each miss as a FAIL', () => {
    const out = run({ EDGE: '1', CONNECT_TO: '' }).stdout;
    const section = out.split('== edge cache (Cloudflare) ==')[1] ?? '';
    const rows = section.split('\n').filter((l) => l.startsWith('FAIL edge'));
    for (const label of [
      'anonymous HTML, 1st',
      'anonymous HTML, 2nd',
      'wordpress_logged_in_ cookie',
      'wp-postpass_ cookie',
      'comment_author_ cookie',
      'Accept: text/markdown',
      'REST',
      'theme CSS',
      'search index',
    ]) {
      expect(
        rows.some((r) => r.includes(label)),
        label
      ).toBe(true);
    }
  });
});
