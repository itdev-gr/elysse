import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts']
  },
  resolve: {
    alias: { '~': new URL('./src', import.meta.url).pathname }
  },
  plugins: [
    {
      name: 'raw-shader',
      transform(_code, id) {
        if (id.endsWith('?raw')) {
          return { code: 'export default ""', map: null };
        }
      },
      resolveId(id) {
        if (id.endsWith('?raw')) return id;
      },
      load(id) {
        if (id.endsWith('?raw')) return 'export default ""';
      }
    }
  ]
});
