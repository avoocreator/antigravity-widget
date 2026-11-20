import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './', // dimuat lewat file:// oleh Electron
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true, target: 'chrome130' },
});
