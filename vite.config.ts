/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      // Sandboxed hosts get one inlineable bundle; regular builds split vendor chunks.
      output: process.env.VITE_TARGET === 'artifact' ? { inlineDynamicImports: true } : { manualChunks: { react: ['react', 'react-dom', 'react-router-dom'], charts: ['recharts'] } },
    },
  },
  test: { environment: 'node' },
});
