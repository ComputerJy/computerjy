import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';

const hasPhp = spawnSync('php', ['-v']).status === 0;

// inc/customizer.php registers an action at load time; stub it for the CLI.
function ga4(value: string): string {
  return execFileSync(
    'php',
    [
      '-r',
      'define("ABSPATH", "/"); function add_action() {} require "inc/customizer.php"; echo computerjy2_sanitize_ga4_id($argv[1]);',
      value,
    ],
    { encoding: 'utf8' }
  );
}

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
