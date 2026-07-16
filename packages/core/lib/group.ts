import { sample } from 'effector';
import { createRoute } from './create-route';
import type { LegacyVirtualRoute, Route } from './types';
import { not, or } from 'patronum';

/**
 * @description Create virtual route which opens when some passed routes is opened. Closes if all passed routes are closed.
 * @link https://router.effector.dev/core/group.html
 * @returns PathlessRoute
 * @example ```ts
 * import { group, createRoute } from '@effector/router';
 *
 * const signInRoute = createRoute();
 * const signUpRoute = createRoute();
 * const authorizationRoute = group([signInRoute, signUpRoute]);
 *
 * signInRoute.open(); // authorizationRoute.$isOpened —> true
 * signUpRoute.open(); // authorizationRoute.$isOpened —> true
 * signInRoute.close(); // authorizationRoute.$isOpened —> true (signUpRoute is still open)
 * signUpRoute.close(); // authorizationRoute.$isOpened —> false (all routes are closed)
 * ```
 */
export function group(routes: (Route<any> | LegacyVirtualRoute<any, any>)[]) {
  const route = createRoute();
  const $isPending = or(...routes.map((item) => item.$isPending));

  const $hasOpenedRoutes = or(...routes.map((route) => route.$isOpened));

  sample({
    clock: routes.map((route) => route.$isOpened),
    filter: $hasOpenedRoutes,
    fn: () => undefined,
    target: route.open,
  });

  sample({
    clock: routes.map((route) => route.$isOpened),
    filter: not($hasOpenedRoutes),
    fn: () => undefined,
    target: route.close,
  });

  return { ...route, $isPending };
}
