import { defineComponent, h } from 'vue';
import type { CreateRouteViewProps, RouteView } from './types';

/**
 * @description Creates Route view without async bundle load
 * @link https://router.effector.dev/vue/create-route-view.html
 * @param props Route view props
 * @returns RouteView
 * @example ```ts
 * import { createRouteView } from '@effector/router-vue';
 * import { routes } from '@shared/routing';
 * import { MainLayout } from '@layouts';
 * import Profile from './profile.vue';
 *
 * export const ProfileScreen = createRouteView({
 *   route: routes.profile,
 *   view: Profile,
 *   layout: MainLayout,
 * });
 * ```
 */
export function createRouteView<T extends object | void = void>(
  props: CreateRouteViewProps<T>,
): RouteView {
  const { route, view, layout, children } = props;

  const wrapped = layout
    ? defineComponent({
        name: 'RouteViewWithLayout',
        setup() {
          return () => h(layout, null, { default: () => h(view) });
        },
      })
    : view;

  return { route, view: wrapped, children };
}
