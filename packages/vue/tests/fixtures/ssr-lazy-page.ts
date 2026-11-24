import { defineComponent, h, onMounted } from 'vue';

// Loaded through a real `import()` by the app of ssr-app.ts.
export const lazyPage = { mounts: 0 };

export default defineComponent({
  name: 'LazyPage',
  setup() {
    onMounted(() => {
      lazyPage.mounts += 1;
    });

    return () => h('article', { 'data-page': 'lazy' }, 'lazy page');
  },
});
