import { defineConfig } from 'tsdown';

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
  outExtensions: () => ({
    js: '.js',
  }),
});
