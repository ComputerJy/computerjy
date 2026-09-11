// tests/check-urls.test.ts
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const script = 'scripts/check-urls.sh';

describe('scripts/check-urls.sh', () => {
  it('is executable bash that passes shellcheck-level syntax (bash -n)', () => {
    expect(() => execFileSync('bash', ['-n', script])).not.toThrow();
  });

  it('checks every slug in scripts/known-slugs.json, not a sample', () => {
    const slugs: string[] = JSON.parse(readFileSync('scripts/known-slugs.json', 'utf8'));
    // --print-urls lists the URLs it would request without hitting the network.
    const out = execFileSync('bash', [script, '--print-urls'], { encoding: 'utf8' });
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
    expect(wp).toContain('/2008/01/1goal 301 https://www.computerjy.com/posts/1goal');
  });
});
