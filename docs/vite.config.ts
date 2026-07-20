import { defineConfig } from 'vite';
import Unocss from 'unocss/vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['@vueuse/core', 'vitepress'],
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
  // Presets live in uno.config.ts so UnoCSS auto-loads them.
  plugins: [Unocss()],
});
