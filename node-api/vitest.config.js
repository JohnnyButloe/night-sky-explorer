// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    mainFields: ['module', 'main'],
  },
  test: {
    include: ['test/locations.spec.js'], // <-- Only run the locations tests!
    environment: 'node',
    globals: true,
    setupFiles: './vitest.setup.js',
    server: {
      deps: {
        inline: ['nock'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/**/*.{js,mjs}',
        'routes/locations.js',
        'cache.js',
        'utils/nominatimClient.js',
      ],
    },
  },
});
