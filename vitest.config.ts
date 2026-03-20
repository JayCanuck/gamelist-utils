import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/cli.ts',
        'src/actions/**',
        'src/index.ts',
        'src/api-types.ts',
        'src/gamelist-types.ts'
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 75,
        statements: 85
      }
    }
  }
});
