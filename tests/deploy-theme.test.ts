import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
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

// A minimal fake repo root with no .env: the script cannot source credentials
// from it, so a run that goes past the STAGE_ONLY exit can never reach a server.
function makeFakeRoot(
  prefix: string,
  extra: Record<string, string> = {}
): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  for (const d of [
    'inc',
    'template-parts',
    'page-templates',
    'assets/css',
    'assets/js',
    'public',
  ]) {
    mkdirSync(join(root, d), { recursive: true });
  }
  writeFileSync(join(root, 'style.css'), '/* empty */');
  writeFileSync(join(root, 'index.php'), '<?php // valid ?>');
  writeFileSync(join(root, 'functions.php'), '<?php // valid ?>');
  writeFileSync(join(root, 'theme.json'), '{}');
  writeFileSync(join(root, 'screenshot.png'), '');
  writeFileSync(
    join(root, 'inc', 'template-tags.php'),
    '<?php function valid() {} ?>'
  );
  for (const [rel, body] of Object.entries(extra))
    writeFileSync(join(root, rel), body);
  return root;
}

// Check if php is available for lint gate tests
const phpAvailable = spawnSync('php', ['-v']).status === 0;

describe('deploy/deploy-theme.sh php -l gate', () => {
  it.skipIf(!phpAvailable)(
    'aborts when a staged .php file has syntax errors',
    () => {
      const fakeRoot = makeFakeRoot('cjy-lint-fail-', {
        'inc/broken.php': '<?php function (',
      });
      const fakeStage = mkdtempSync(join(tmpdir(), 'cjy-stage-lint-'));

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
      const fakeRoot = makeFakeRoot('cjy-lint-ok-');
      const fakeStage = mkdtempSync(join(tmpdir(), 'cjy-stage-lint-'));

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

describe('deploy/deploy-theme.sh staging directory lifetime', () => {
  const stagedPath = (out: string) =>
    /Staging theme in (\S+)\/theme/.exec(out)?.[1] ?? '';
  // ROOT_DIR points at a fake root (no .env), and every host variable is
  // blanked, so a run that passes the STAGE_ONLY exit stops at the
  // SERVER_HOST check — after the cleanup trap must have been armed.
  const run = (env: Record<string, string>) =>
    spawnSync('bash', ['deploy/deploy-theme.sh'], {
      env: {
        ...process.env,
        ROOT_DIR: makeFakeRoot('cjy-lifetime-'),
        SERVER_HOST: '',
        LIGHTSAIL_HOST: '',
        ...env,
      },
      encoding: 'utf-8',
    });

  it('removes a self-created STAGE_DIR once the deploy proper begins', () => {
    const result = run({ STAGE_DIR: '', STAGE_ONLY: '0' });
    const dir = stagedPath(result.stdout);
    expect(dir).not.toBe('');
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain('SERVER_HOST is not set');
    expect(existsSync(dir)).toBe(false);
  });

  it('keeps a self-created STAGE_DIR under STAGE_ONLY=1 so it can be inspected', () => {
    const result = run({ STAGE_DIR: '', STAGE_ONLY: '1' });
    const dir = stagedPath(result.stdout);
    expect(result.status).toBe(0);
    expect(dir).not.toBe('');
    expect(existsSync(join(dir, 'theme', 'style.css'))).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  it('never removes a STAGE_DIR passed in by the caller', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cjy-stage-keep-'));
    const result = run({ STAGE_DIR: dir, STAGE_ONLY: '0' });
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain('SERVER_HOST is not set');
    expect(existsSync(join(dir, 'theme', 'style.css'))).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });
});
