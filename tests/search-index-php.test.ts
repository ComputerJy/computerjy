import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';

const hasPhp = spawnSync('php', ['-v']).status === 0;

describe.skipIf(!hasPhp)('computerjy2_search_index_data', () => {
  it('leaves password-protected posts out of the public index', () => {
    const args = execFileSync(
      'php',
      [
        '-r',
        `define("ABSPATH", "/"); define("HOUR_IN_SECONDS", 3600);
        function add_action() {} function add_filter() {}
        function get_transient() { return false; } function set_transient() {}
        function get_posts($a) { echo json_encode($a); return []; }
        require "inc/search-index.php";
        computerjy2_search_index_data();`,
      ],
      { encoding: 'utf8' }
    );
    expect(JSON.parse(args)).toMatchObject({
      post_status: 'publish',
      has_password: false,
    });
  });
});
