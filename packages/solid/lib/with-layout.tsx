import type { Component, JSX } from 'solid-js';
import { layoutGroup, type RouteView } from './types';

let nextLayoutGroupToken = 0;

/**
 * @description Group routes by layout, so you don't need to pass `layout` property manually in all routes. Works for `createRouteView` and `createLazyRouteView`.
 * @link https://router.effector.dev/solid/with-layout.html
 * @example ```tsx
 * import {
 *   createRoutesView,
 *   createRouteView,
 *   withLayout,
 * } from '@effector/router-solid';
 *
 * import { SignInScreen } from './sign-in';
 * import { SignUpScreen } from './sign-up';
 * import { ProfileScreen } from './profile';
 *
 * import { routes } from '@shared/routing';
 *
 * import { AuthLayout } from '@layouts/auth';
 *
 * export const RoutesView = createRoutesView({
 *   routes: [
 *     ...withLayout(AuthLayout, [
 *       createRouteView({ route: routes.signIn, view: SignInScreen }),
 *       createRouteView({ route: routes.signUp, view: SignUpScreen }),
 *     ]),
 *     createRouteView({ route: routes.profile, view: ProfileScreen }),
 *   ],
 * });
 * ```
 */
export function withLayout(
  layout: Component<{ children: JSX.Element }>,
  views: RouteView[],
): RouteView[] {
  const group = { token: ++nextLayoutGroupToken, layout };

  return views.map((view) => ({ ...view, [layoutGroup]: group }));
}
