import { defineComponent, provide, type PropType } from 'vue';
import type { Router } from '@effector/router';
import { RouterInjectionKey } from './context';

/**
 * @description Provides router in the Vue component tree
 * @link https://router.effector.dev/vue/router-provider.html
 * @example ```ts
 * import { RouterProvider } from '@effector/router-vue';
 * import { router } from './router';
 *
 * // in your root component render:
 * // <RouterProvider :router="router"><RoutesView /></RouterProvider>
 * ```
 */
export const RouterProvider = defineComponent({
  name: 'RouterProvider',
  props: {
    router: { type: Object as PropType<Router>, required: true },
  },
  setup(props, { slots }) {
    provide(RouterInjectionKey, props.router);

    return () => slots.default?.();
  },
});
