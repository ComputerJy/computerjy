// Self-hosted fonts (#74): the three families ship from assets/fonts and
// nothing on the page reaches fonts.googleapis.com any more.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const fontsCss = readFileSync('assets/css/fonts.css', 'utf8');
const faces = fontsCss.match(/@font-face\s*\{[^}]*\}/g) ?? [];
const files = [
  ...fontsCss.matchAll(/url\(["']?\.\.\/fonts\/([^"')]+)["']?\)/g),
].map((m) => m[1]);

describe('assets/css/fonts.css', () => {
  it('declares latin and latin-ext faces for all three families', () => {
    for (const family of ['Inter', 'Plus Jakarta Sans', 'JetBrains Mono']) {
      const own = faces.filter((f) => f.includes(`font-family: '${family}'`));
      expect(own, family).toHaveLength(2);
    }
  });

  it('every face is a variable woff2 with font-display: swap and a unicode-range', () => {
    expect(faces.length).toBeGreaterThan(0);
    for (const face of faces) {
      expect(face).toContain('font-display: swap');
      expect(face).toMatch(/font-weight: \d{3} \d{3};/);
      expect(face).toContain('unicode-range:');
      expect(face).toMatch(/format\('woff2'\)/);
    }
  });

  it('references only files that exist in assets/fonts', () => {
    expect(files.length).toBe(faces.length);
    for (const f of files)
      expect(existsSync(`assets/fonts/${f}`), f).toBe(true);
  });

  it('ships the OFL license next to the files', () => {
    const ofl = readFileSync('assets/fonts/OFL.txt', 'utf8');
    for (const name of ['Inter', 'Plus Jakarta Sans', 'JetBrains Mono'])
      expect(ofl).toContain(name);
    expect(ofl).toContain('SIL OPEN FONT LICENSE');
  });
});

describe('no Google Fonts requests remain', () => {
  it.each([
    'functions.php',
    'header.php',
    'preview-home.html',
    'preview-single.html',
    'assets/css/theme.css',
  ])('%s', (file) => {
    expect(readFileSync(file, 'utf8')).not.toMatch(
      /fonts\.(googleapis|gstatic)\.com/
    );
  });
});

describe.each(['preview-home.html', 'preview-single.html'])(
  '%s preloads',
  (file) => {
    const html = readFileSync(file, 'utf8');
    it('loads fonts.css and preloads the body and heading latin files', () => {
      expect(html).toContain('href="assets/css/fonts.css"');
      for (const f of ['inter-latin.woff2', 'plus-jakarta-sans-latin.woff2']) {
        expect(html).toMatch(
          new RegExp(
            `<link[^>]*rel="preload"[^>]*href="assets/fonts/${f}"[^>]*>`
          )
        );
        expect(files).toContain(f);
      }
    });
  }
);
