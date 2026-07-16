import { type ComponentType, type ReactNode } from 'react';
import { layoutGroup, type RouteView } from './types';

let nextLayoutGroupToken = 0;

/**
 * @description Group routes by layout, so you don't need to pass `layout` property manually in all routes. Works for `createRouteView` and `createLazyRouteView`.
 * @link https://router.effector.dev/react/with-layout.html
 * @example ```tsx
 * import {
 *   createRoutesView,
 *   createRouteView,
 *   withLayout,
 * } from '@effector/router-react';
 *
 * import { ProfileScreen } from './profile';
 * import { SignInScreen } from './sign-in';
 * import { SignUpScreen } from './sign-up';
 *
 * import { routes } from '@shared/routing';
 *
 * import { AuthLayout } from '@layouts/auth';
 *
 * export const RoutesView = createRoutesView([
 *   ...withLayout(AuthLayout, [
 *     createRouteView({ route: routes.signIn, view: SignInScreen }),
 *     createRouteView({ route: routes.signUp, view: SignUpScreen }),
 *   ]),
 *   createRouteView({ route: routes.profile, view: ProfileScreen }),
 * ]);
 * ```
 */
export function withLayout(
  layout: ComponentType<{ children: ReactNode }>,
  views: RouteView[],
) {
  const group = { token: ++nextLayoutGroupToken, layout };

  return views.map((view) => ({ ...view, [layoutGroup]: group }));
}
