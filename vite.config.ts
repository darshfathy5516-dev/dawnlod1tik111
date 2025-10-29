import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        en: './en/index.html',
        ar: './ar/index.html',
        es: './es/index.html',
        de: './de/index.html',
        fr: './fr/index.html',
        pt: './pt/index.html'
      }
    }
  }
});
