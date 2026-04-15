import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['cjs', 'esm'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: true,
  minify: false,
  external: ['@ts-rest/core', 'zod', '@csisp-api/bff-idp-server'],
});
