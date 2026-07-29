import { OutletContext } from './context';
import { createElement, useContext } from 'react';
import { useResolvedRouteView } from './resolve-route-view';
import type { RouteView } from './types';

const noChildren: RouteView[] = [];

/**
 * @description Outlet component for nested routes
 * @link https://router.effector.dev/react/outlet.html
 * @example ```ts
 * export const RoutesView = createRoutesView([
 *   createRouteView({
 *     route: routes.profile,
 *     view: ProfileScreen,
 *     children: [
 *      createRouteView({ route: routes.settings, view: SettingsScreen }),
 *     ]
 *   }),
 * ]);
 *
 * // profile.tsx
 * export const ProfileScreen = () => {
 *   // will render settings screen when profile route is opened
 *   // and settings route is active
 *   return (
 *     <>
 *       <div>Profile</div>
 *       <Outlet />
 *     </>
 *   );
 * };
 * ```
 */
export const Outlet = () => {
  const { children } = useContext(OutletContext) ?? { children: noChildren };
  const resolved = useResolvedRouteView(children);

  if (!resolved) {
    return null;
  }

  return (
    <OutletContext.Provider value={{ children: resolved.view.children ?? [] }}>
      {createElement(resolved.component)}
    </OutletContext.Provider>
  );
};
