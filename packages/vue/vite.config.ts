import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import vue from '@vitejs/plugin-vue';

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
        'effector-vue',
        'effector-vue/composition',
        '@effector/router',
        'vue',
      ],
      output: {
        globals: {
          effector: 'effector',
          'effector-vue': 'effector-vue',
          'effector-vue/composition': 'effector-vue/composition',
          '@effector/router': '@effector/router',
          vue: 'vue',
        },
      },
    },
  },
  plugins: [
    vue(),
    dts({
      outDir: resolve(__dirname, 'dist'),
      entryRoot: resolve(__dirname, 'lib'),
      exclude: [resolve(__dirname, 'tests'), resolve(__dirname, '../../docs')],
      staticImport: true,
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
  },
});
