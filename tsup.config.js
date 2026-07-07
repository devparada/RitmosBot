import { defineConfig } from 'tsup';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  entry: [
    'src/**/*.ts',
    'src/**/*.js',
  ],
  format: ['esm'],
  clean: true,
  shims: true,
  bundle: false,
  outDir: 'dist',
  target: 'es2022',
  // Copiamos el archivo manualmente al terminar la compilación
  async onSuccess() {
    const srcPath = path.join(process.cwd(), 'src/config/player.config.js');
    const distDir = path.join(process.cwd(), 'dist/config');
    const destPath = path.join(distDir, 'player.config.js');

    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log('⚡️ [Custom] player.config.js copiado con éxito a dist/config/');
    } else {
      console.warn('⚠️ [Custom] No se encontró src/config/player.config.js');
    }
  }
});