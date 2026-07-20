import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
} from 'unocss';

// Standalone config so UnoCSS's file discovery finds it — passing presets
// inline to the Vite plugin left `@unocss/config` logging "config file not
// found, loading default config" on every build.
export default defineConfig({
  presets: [
    presetUno({ dark: 'media' }),
    presetAttributify(),
    presetIcons({ scale: 1.2 }),
  ],
});
