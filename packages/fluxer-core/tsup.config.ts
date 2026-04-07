import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    client: 'src/subpath-client.ts',
    errors: 'src/subpath-errors.ts',
    message: 'src/subpath-message.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  clean: true,
});
