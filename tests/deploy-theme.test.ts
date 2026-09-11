import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const stage = mkdtempSync(join(tmpdir(), 'cjy-stage-'));

beforeAll(() => {
  execFileSync('bash', ['deploy/deploy-theme.sh'], {
    env: { ...process.env, STAGE_ONLY: '1', STAGE_DIR: stage, SERVER_HOST: 'unused' },
    stdio: 'pipe',
  });
});

describe('deploy/deploy-theme.sh staging', () => {
  it.each([
    'theme/style.css',
    'theme/index.php',
    'theme/functions.php',
    'theme/theme.json',
    'theme/screenshot.png',
    'theme/inc/template-tags.php',
    'theme/inc/slots.php',
    'theme/template-parts/content-card.php',
    'theme/page-templates',
    'theme/assets/css/theme.css',
    'theme/assets/js/theme.js',
  ])('stages %s', (rel) => {
    expect(existsSync(join(stage, rel))).toBe(true);
  });

  it.each([
    'theme/.env',
    'theme/node_modules',
    'theme/src',
    'theme/dist',
    'theme/public',
    'theme/workers',
    'theme/tests',
    'theme/package.json',
    'theme/MIGRATION.md',
    'theme/preview-home.html',
    'theme/inc/computerjy-rebuild-webhook.php',
    'theme/inc/computerjy-rest-comments.php',
    'theme/inc/computerjy-edge-cache.php',
  ])('does not stage %s', (rel) => {
    expect(existsSync(join(stage, rel))).toBe(false);
  });

  it.each([
    'webroot/.well-known/api-catalog',
    'webroot/.well-known/openid-configuration',
    'webroot/api/openapi.json',
    'webroot/robots.txt',
    'webroot/security.txt',
    'webroot/auth.md',
    'webroot/markdown.php',
  ])('stages the discovery file %s for the WordPress docroot', (rel) => {
    expect(existsSync(join(stage, rel))).toBe(true);
  });
});
