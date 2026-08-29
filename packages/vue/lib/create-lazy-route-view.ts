import { defineAsyncComponent, defineComponent, h } from 'vue';
import { createRouteViewFallback } from './resolve-route-view';
import {
  routeViewFallback,
  type CreateLazyRouteViewProps,
  type RouteView,
} from './types';

/**
 * @description Creates Lazy route view with async bundle load
 * @link https://router.effector.dev/vue/create-lazy-route-view.html
 * @param props Lazy route view props
 * @returns RouteView
 * @example ```ts
 * import { createLazyRouteView } from '@effector/router-vue';
 * import { routes } from '@shared/routing';
 * import { MainLayout } from '@layouts';
 * import Skeleton from './skeleton.vue';
 *
 * export const ProfileScreen = createLazyRouteView({
 *   route: routes.profile,
 *   view: () => import('./profile.vue'),
 *   loading: Skeleton,
 *   layout: MainLayout,
 * });
 * ```
 */
export function createLazyRouteView<T extends object | void = void>(
  props: CreateLazyRouteViewProps<T>,
): RouteView {
  const { route, view, layout, children } = props;
  // One component covers both waits — the pending route and the chunk request.
  // The deprecated `fallback` is kept as its alias.
  const loading = props.loading ?? props.fallback;

  const AsyncView = defineAsyncComponent({
    loader: view,
    loadingComponent: loading,
    delay: 0,
  });

  const wrapped = layout
    ? defineComponent({
        name: 'LazyRouteViewWithLayout',
        setup() {
          return () => h(layout, null, { default: () => h(AsyncView) });
        },
      })
    : defineComponent({
        name: 'LazyRouteView',
        setup() {
          return () => h(AsyncView);
        },
      });

  const routeFallback = createRouteViewFallback({ ...props, loading });

  return {
    route,
    view: wrapped,
    children,
    ...(routeFallback ? { [routeViewFallback]: routeFallback } : {}),
  };
}
