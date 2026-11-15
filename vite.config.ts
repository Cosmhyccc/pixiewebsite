import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// The website verifies the installer it serves; derive the expected hash from the file itself.
const dmgSHA256 = createHash('sha256').update(readFileSync('public/downloads/Pixie.dmg')).digest('hex');

export default defineConfig({
  base: '/',
  define: { __DMG_SHA256__: JSON.stringify(dmgSHA256) },
  build: { rollupOptions: { input: { main: 'index.html', models: 'models.html' } } },
});
