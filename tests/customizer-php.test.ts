import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';

const hasPhp = spawnSync('php', ['-v']).status === 0;

// inc/customizer.php registers an action at load time; stub it for the CLI.
function sanitize(fn: string, value: string): string {
  return execFileSync(
    'php',
    [
      '-r',
      `define("ABSPATH", "/"); function add_action() {} require "inc/customizer.php"; echo ${fn}($argv[1]);`,
      value,
    ],
    { encoding: 'utf8' }
  );
}
const ga4 = (v: string) => sanitize('computerjy2_sanitize_ga4_id', v);
const adsense = (v: string) => sanitize('computerjy2_sanitize_adsense_id', v);

describe.skipIf(!hasPhp)('computerjy2_sanitize_ga4_id', () => {
  it('accepts a measurement ID, normalising case and whitespace', () => {
    expect(ga4(' g-abc123xyz ')).toBe('G-ABC123XYZ');
  });

  it('drops anything that is not a measurement ID', () => {
    expect(ga4('UA-12345-1')).toBe('');
    expect(ga4('G-1"><script>')).toBe('');
    expect(ga4('')).toBe('');
  });
});

describe.skipIf(!hasPhp)('computerjy2_sanitize_adsense_id', () => {
  it('accepts a publisher ID with or without the ca- prefix', () => {
    expect(adsense(' pub-4480676073741111 ')).toBe('pub-4480676073741111');
    expect(adsense('ca-pub-4480676073741111')).toBe('pub-4480676073741111');
  });

  it('drops anything that is not a publisher ID', () => {
    expect(adsense('pub-123')).toBe('');
    expect(adsense('pub-4480676073741111"><script>')).toBe('');
    expect(adsense('')).toBe('');
  });
});
