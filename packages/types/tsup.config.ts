import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    routes: 'src/subpath-routes.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  clean: true,
});
