import { describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const chrome = process.env.CHROME_BIN || 'google-chrome';
const hasChrome = spawnSync(chrome, ['--version']).status === 0;

// Reproduce Google's full-width mobile unit without requesting real ads.
// An iframe supplies an exact CSS viewport, independent of headless window size.
describe.skipIf(!hasChrome)(
  'article grid with a full-width sponsor unit',
  () => {
    it.each([360, 440, 768, 1024])(
      'keeps the grid and document within a %ipx viewport',
      (width) => {
        const dir = mkdtempSync(join(tmpdir(), 'cjy-article-layout-'));
        try {
          const css = readFileSync('assets/css/theme.css', 'utf8');
          const mobile = width <= 900;
          const unitWidth = mobile ? width : 246;
          const offset = mobile ? -21 : 0;
          const fixture = `<style>${css}</style>
          <div class="single-shell">
            <div class="single-main"><p>Article content</p></div>
            <aside class="single-aside"><div class="is-sticky-slot">
              <div class="reserved-unit unit-sidebar is-filled">
                <ins class="adsbygoogle" data-ad-status="filled"
                  style="display:block;width:${unitWidth}px;height:250px;margin-left:${offset}px">
                  <div style="display:inline-block;width:${unitWidth}px;height:250px"></div>
                </ins>
              </div>
            </div></aside>
          </div>`;
          const srcdoc = fixture
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;');
          const file = join(dir, 'fixture.html');
          writeFileSync(
            file,
            `<iframe style="width:${width}px;height:600px;border:0" srcdoc="${srcdoc}"></iframe>
          <pre id="result"></pre><script>
            const frame = document.querySelector('iframe');
            frame.onload = () => {
              const doc = frame.contentDocument;
              document.querySelector('#result').textContent = JSON.stringify({
                scrollWidth: doc.documentElement.scrollWidth,
                sidebarRight: doc.querySelector('.single-aside').getBoundingClientRect().right,
                unitWidth: doc.querySelector('ins').getBoundingClientRect().width
              });
            };
          </script>`
          );
          const dom = execFileSync(
            chrome,
            [
              '--headless',
              '--no-sandbox',
              '--disable-gpu',
              '--disable-background-networking',
              `--user-data-dir=${join(dir, 'profile')}`,
              '--virtual-time-budget=1000',
              '--dump-dom',
              pathToFileURL(file).href,
            ],
            {
              encoding: 'utf8',
              timeout: 20000,
              stdio: ['ignore', 'pipe', 'pipe'],
            }
          );
          const result = JSON.parse(
            dom.match(/<pre id="result">([^<]+)<\/pre>/)?.[1] || '{}'
          );
          expect(result.unitWidth).toBe(unitWidth);
          expect(result.sidebarRight).toBeLessThanOrEqual(width);
          expect(result.scrollWidth).toBe(width);
        } finally {
          rmSync(dir, { recursive: true, force: true });
        }
      },
      25000
    );
  }
);
