import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      // Miniflare options for Cloudflare Workers testing
      kvNamespaces: ['MCP_REGISTRY', 'MCP_CACHE'],
      bindings: {
        ENVIRONMENT: 'test',
        RATE_LIMIT_REQUESTS: '100',
        RATE_LIMIT_WINDOW: '60',
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.config.ts',
      ],
    },
  },
});
