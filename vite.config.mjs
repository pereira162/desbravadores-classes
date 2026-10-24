import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/desbravadores-classes/',
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src/client'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3333',
      '/data': 'http://localhost:3333',
    },
  },
});
