import { defineComponent, h, type Component } from 'vue';
import type { RouteView } from './types';

/**
 * @description Group routes by layout, so you don't need to pass `layout`
 * property manually in all routes. Works for `createRouteView` and
 * `createLazyRouteView`.
 * @link https://router.effector.dev/vue/with-layout.html
 * @example ```ts
 * export const RoutesView = createRoutesView({
 *   routes: [
 *     ...withLayout(AuthLayout, [
 *       createRouteView({ route: routes.signIn, view: SignIn }),
 *       createRouteView({ route: routes.signUp, view: SignUp }),
 *     ]),
 *     createRouteView({ route: routes.profile, view: Profile }),
 *   ],
 * });
 * ```
 */
export function withLayout(layout: Component, views: RouteView[]): RouteView[] {
  return views.map((view) => ({
    ...view,
    view: defineComponent({
      name: 'WithLayout',
      setup() {
        return () => h(layout, null, { default: () => h(view.view) });
      },
    }),
  }));
}
