import { sample } from 'effector';
import { createVirtualRoute } from './create-virtual-route';
import type { Route, VirtualRoute } from './types';
import { not, or } from 'patronum';

/**
 * @description Create virtual route which opens when some passed routes is opened. Closes if all passed routes are closed.
 * @link https://router.effector.dev/core/group.html
 * @returns VirtualRoute
 * @example ```ts
 * import { group, createVirtualRoute } from '@effector/router';
 *
 * const signInRoute = createVirtualRoute();
 * const signUpRoute = createVirtualRoute();
 * const authorizationRoute = group([signInRoute, signUpRoute]);
 *
 * signInRoute.open(); // authorizationRoute.$isOpened —> true
 * signUpRoute.open(); // authorizationRoute.$isOpened —> true
 * signInRoute.close(); // authorizationRoute.$isOpened —> true (signUpRoute is still open)
 * signUpRoute.close(); // authorizationRoute.$isOpened —> false (all routes are closed)
 * ```
 */
export function group(routes: (Route<any> | VirtualRoute<any, any>)[]) {
  const virtual = createVirtualRoute({
    $isPending: or(...routes.map((route) => route.$isPending)),
  });

  const $hasOpenedRoutes = or(...routes.map((route) => route.$isOpened));

  sample({
    clock: routes.map((route) => route.$isOpened),
    filter: $hasOpenedRoutes,
    fn: () => undefined,
    target: virtual.open,
  });

  sample({
    clock: routes.map((route) => route.$isOpened),
    filter: not($hasOpenedRoutes),
    fn: () => undefined,
    target: virtual.close,
  });

  return virtual;
}
