import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Every theme PHP file is reachable at /wp-content/themes/computerjy-2/…; a
// direct request must exit before rendering anything. public/markdown.php is
// the one deliberate HTTP entry point (it loads WordPress itself).
const files = execFileSync('git', ['ls-files', '*.php'], { encoding: 'utf8' })
  .split('\n')
  .filter((f) => f && f !== 'public/markdown.php');

describe('ABSPATH guard', () => {
  it.each(files)('%s exits when loaded directly', (file) => {
    expect(readFileSync(file, 'utf8')).toMatch(
      /if \( ! defined\( 'ABSPATH' \) \) \{\s*exit;\s*\}/
    );
  });
});
