import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const stage = mkdtempSync(join(tmpdir(), 'cjy-stage-'));

beforeAll(() => {
  execFileSync('bash', ['deploy/deploy-theme.sh'], {
    env: {
      ...process.env,
      STAGE_ONLY: '1',
      STAGE_DIR: stage,
      SERVER_HOST: 'unused',
    },
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

// Check if php is available for lint gate tests
const phpAvailable = spawnSync('php', ['-v']).status === 0;

describe('deploy/deploy-theme.sh php -l gate', () => {
  it.skipIf(!phpAvailable)(
    'aborts when a staged .php file has syntax errors',
    () => {
      const fakeRoot = mkdtempSync(join(tmpdir(), 'cjy-lint-fail-'));
      const fakeStage = mkdtempSync(join(tmpdir(), 'cjy-stage-lint-'));

      // Create minimal fake repo structure with a broken PHP file
      mkdirSync(join(fakeRoot, 'inc'), { recursive: true });
      mkdirSync(join(fakeRoot, 'template-parts'), { recursive: true });
      mkdirSync(join(fakeRoot, 'page-templates'), { recursive: true });
      mkdirSync(join(fakeRoot, 'assets', 'css'), { recursive: true });
      mkdirSync(join(fakeRoot, 'assets', 'js'), { recursive: true });
      mkdirSync(join(fakeRoot, 'public'), { recursive: true });

      // Write minimal files
      writeFileSync(join(fakeRoot, 'style.css'), '/* empty */');
      writeFileSync(join(fakeRoot, 'index.php'), '<?php // valid ?>');
      writeFileSync(join(fakeRoot, 'functions.php'), '<?php // valid ?>');
      writeFileSync(join(fakeRoot, 'theme.json'), '{}');
      writeFileSync(join(fakeRoot, 'screenshot.png'), '');
      writeFileSync(join(fakeRoot, 'inc', 'broken.php'), '<?php function (');

      const result = spawnSync('bash', ['deploy/deploy-theme.sh'], {
        env: {
          ...process.env,
          ROOT_DIR: fakeRoot,
          STAGE_ONLY: '1',
          STAGE_DIR: fakeStage,
          SERVER_HOST: 'unused',
        },
        encoding: 'utf-8',
      });

      expect(result.status).not.toBe(0);
      expect(result.stdout + result.stderr).toContain('PHP syntax error');
    }
  );

  it.skipIf(!phpAvailable)(
    'succeeds when all staged .php files are valid',
    () => {
      const fakeRoot = mkdtempSync(join(tmpdir(), 'cjy-lint-ok-'));
      const fakeStage = mkdtempSync(join(tmpdir(), 'cjy-stage-lint-'));

      // Create minimal fake repo structure with valid PHP files
      mkdirSync(join(fakeRoot, 'inc'), { recursive: true });
      mkdirSync(join(fakeRoot, 'template-parts'), { recursive: true });
      mkdirSync(join(fakeRoot, 'page-templates'), { recursive: true });
      mkdirSync(join(fakeRoot, 'assets', 'css'), { recursive: true });
      mkdirSync(join(fakeRoot, 'assets', 'js'), { recursive: true });
      mkdirSync(join(fakeRoot, 'public'), { recursive: true });

      // Write minimal files with valid PHP
      writeFileSync(join(fakeRoot, 'style.css'), '/* empty */');
      writeFileSync(join(fakeRoot, 'index.php'), '<?php // valid ?>');
      writeFileSync(join(fakeRoot, 'functions.php'), '<?php // valid ?>');
      writeFileSync(join(fakeRoot, 'theme.json'), '{}');
      writeFileSync(join(fakeRoot, 'screenshot.png'), '');
      writeFileSync(
        join(fakeRoot, 'inc', 'template-tags.php'),
        '<?php function valid() {} ?>'
      );

      const result = spawnSync('bash', ['deploy/deploy-theme.sh'], {
        env: {
          ...process.env,
          ROOT_DIR: fakeRoot,
          STAGE_ONLY: '1',
          STAGE_DIR: fakeStage,
          SERVER_HOST: 'unused',
        },
        encoding: 'utf-8',
      });

      expect(result.status).toBe(0);
      expect(result.stdout + result.stderr).toContain('Staged only');
    }
  );
});
