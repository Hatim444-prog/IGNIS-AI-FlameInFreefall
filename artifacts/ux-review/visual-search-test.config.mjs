import { defineConfig } from '../../frontend/node_modules/@playwright/test/index.mjs';
export default defineConfig({
  testDir: '../../frontend/tests',
  testMatch: ['visual-library.spec.ts', 'workspace.spec.ts'],
  outputDir: './visual-search-test-results',
  timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:5174', channel: 'chrome' },
  reporter: 'list',
});
