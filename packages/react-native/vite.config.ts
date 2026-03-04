import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import react from '@vitejs/plugin-react';

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
        'effector-react',
        '@effector/router',
        '@effector/router-react',
        '@react-navigation/native',
        '@react-navigation/bottom-tabs',
        '@react-navigation/stack',
        'react',
        'react-native',
        'react/jsx-runtime',
      ],
      output: {
        globals: {
          react: 'react',
          effector: 'effector',
          'effector-react': 'effector-react',
          '@effector/router': '@effector/router',
          'react/jsx-runtime': 'react/jsx-runtime',
        },
      },
    },
  },
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    dts({
      outDir: resolve(__dirname, 'dist'),
      entryRoot: resolve(__dirname, 'lib'),
      exclude: [
        resolve(__dirname, 'tests'),
        resolve(__dirname, '../effector/router-paths'),
        resolve(__dirname, '../effector/router-core'),
        resolve(__dirname, '../effector/router-react'),
      ],
      staticImport: true,
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
});
