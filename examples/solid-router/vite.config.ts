import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid({ hot: false })],
  server: { port: 4174, strictPort: true },
  preview: { port: 4174, strictPort: true },
});
