import { defineConfig } from 'vite';

// wowpixie.com now redirects to homie; only the legal/return pages remain live here.
export default defineConfig({
  base: '/',
  build: { rollupOptions: { input: { main: 'index.html', models: 'models.html' } } },
});
