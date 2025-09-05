import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BMadUIComponents',
      fileName: 'index',
      formats: ['es']
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['@bmad/shared'],
      output: {
        globals: {
          '@bmad/shared': 'BMadShared'
        }
      }
    }
  }
});