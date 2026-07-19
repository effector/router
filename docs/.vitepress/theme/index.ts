// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import HeroCode from './components/HeroCode.vue';
import HeroTriad from './components/HeroTriad.vue';
import HomeExtras from './components/HomeExtras.vue';
import './style.css';
import 'uno.css';

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'home-hero-image': () => h(HeroCode),
      'home-hero-info-after': () => h(HeroTriad),
      'home-features-after': () => h(HomeExtras),
    });
  },
  enhanceApp() {},
} satisfies Theme;
