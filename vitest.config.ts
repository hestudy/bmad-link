import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@bmad/shared': resolve(__dirname, './packages/shared/src'),
      '@bmad/ui-components': resolve(__dirname, './packages/ui-components/src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 1000,
    isolate: false,
    pool: 'forks',
    reporter: [
      'default',
      'json',
      'junit',
      'html'
    ],
    outputFile: {
      json: 'tests/reports/vitest-results.json',
      junit: 'tests/reports/junit.xml',
      html: 'tests/reports/vitest-report.html'
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'tests/reports/coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/reports/**',
      ],
    },
    onConsoleLog: (log: string): boolean => {
      // 过滤掉无关的控制台输出
      if (log.includes('Extension log message') || log.includes('Insecure protocol detected')) {
        return false;
      }
      return true;
    },
  },
});