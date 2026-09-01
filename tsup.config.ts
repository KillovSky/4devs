import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', cli: 'src/cli.ts' },
  format: ['esm', 'cjs'],
  dts: { entry: { index: 'src/index.ts' } },
  splitting: false,
  sourcemap: false,
  clean: true,
  target: 'node18',
  shims: true,
});
