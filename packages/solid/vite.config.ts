import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import solid from 'vite-plugin-solid';

export default defineConfig({
  mode: 'production',
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/index.ts'),
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'effector',
        'effector-solid',
        '@effector/router',
        'solid-js',
        'solid-js/web',
        'solid-js/store',
      ],
      output: {
        globals: {
          'solid-js': 'solid-js',
          'solid-js/web': 'solid-js/web',
          'solid-js/store': 'solid-js/store',
          effector: 'effector',
          'effector-solid': 'effector-solid',
          '@effector/router': '@effector/router',
        },
      },
    },
  },
  plugins: [
    // `hot` (solid-refresh) is only useful behind a dev server; this package is
    // consumed as a library and built/tested only, and the refresh runtime
    // breaks under vitest, so keep it disabled.
    solid({ hot: false }),
    dts({
      outDir: resolve(__dirname, 'dist'),
      entryRoot: resolve(__dirname, 'lib'),
      exclude: [
        resolve(__dirname, 'tests'),
        resolve(__dirname, '../core'),
        resolve(__dirname, '../paths'),
        resolve(__dirname, '../react'),
        resolve(__dirname, '../react-native'),
      ],
      staticImport: true,
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  resolve: {
    conditions: ['development', 'browser'],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    server: {
      deps: {
        inline: [/solid-js/, /@solidjs\/testing-library/, /effector-solid/],
      },
    },
  },
});
