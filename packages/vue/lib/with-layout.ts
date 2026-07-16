import { type Component } from 'vue';
import { layoutGroup, type RouteView } from './types';

let nextLayoutGroupToken = 0;

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
  const group = { token: ++nextLayoutGroupToken, layout };

  return views.map((view) => ({
    ...view,
    [layoutGroup]: group,
  }));
}
