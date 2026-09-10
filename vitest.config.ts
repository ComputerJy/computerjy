import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    // The repo's own tests live in tests/. design-system/ is a standalone
    // React package with its own vitest.config.ts (jsdom environment,
    // vitest.setup.ts) — without this exclude, vitest's default include
    // glob sweeps up design-system/src/**/*.test.tsx and runs it under the
    // root's node environment, where every test fails with
    // "ReferenceError: document is not defined". Spread vitest's own
    // defaults (node_modules, dist, etc.) rather than overwriting them.
    exclude: [...configDefaults.exclude, 'design-system/**'],
  },
});
