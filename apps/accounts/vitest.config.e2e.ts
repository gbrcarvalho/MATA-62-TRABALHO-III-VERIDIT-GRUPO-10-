import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: {
      JWT_SECRET: 'segredo-apenas-para-testes-e2e-0123456789',
      JWT_EXPIRATION: '1200',
    },
  },
});
