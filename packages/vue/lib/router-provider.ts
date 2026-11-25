import { defineComponent, provide, type PropType } from 'vue';
import type { Router } from '@effector/router';
import { RouterInjectionKey } from './context';

// `@__PURE__` tells a bundler that this call has no side effects, so an
// application that does not use the component drops it.
// Test: "a partial import of the one-file build leaves no component in the
// bundle".
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
export const RouterProvider = /* @__PURE__ */ defineComponent({
  name: 'RouterProvider',
  props: {
    router: { type: Object as PropType<Router>, required: true },
  },
  setup(props, { slots }) {
    provide(RouterInjectionKey, props.router);

    return () => slots.default?.();
  },
});
