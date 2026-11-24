import { defineComponent, h } from 'vue';

// Loaded through a real `import()` by lazy.test.ts.
export default defineComponent({ render: () => h('p', 'loaded') });
