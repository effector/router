import { defineAsyncComponent, defineComponent, h } from 'vue';
import { is, type InternalRoute } from '@effector/router';
import type { CreateLazyRouteViewProps, RouteView } from './types';

/**
 * @description Creates Lazy route view with async bundle load
 * @link https://router.effector.dev/vue/create-lazy-route-view.html
 * @param props Lazy route view props
 * @returns RouteView
 * @example ```ts
 * import { createLazyRouteView } from '@effector/router-vue';
 * import { routes } from '@shared/routing';
 * import { MainLayout } from '@layouts';
 * import Fallback from './fallback.vue';
 *
 * export const ProfileScreen = createLazyRouteView({
 *   route: routes.profile,
 *   view: () => import('./profile.vue'),
 *   fallback: Fallback,
 *   layout: MainLayout,
 * });
 * ```
 */
export function createLazyRouteView<T extends object | void = void>(
  props: CreateLazyRouteViewProps<T>,
): RouteView {
  const { route, view, layout, fallback, children } = props;

  if (!is.router(route)) {
    (route as InternalRoute<T>).internal.setAsyncImport(view);
  }

  const AsyncView = defineAsyncComponent({
    loader: view,
    loadingComponent: fallback,
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

  return { route, view: wrapped, children };
}
