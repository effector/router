import { OutletContext } from './context';
import { createElement, memo, useContext } from 'react';
import {
  noChildren,
  useOutletValue,
  useResolvedRouteView,
  type ResolvedRouteView,
} from './resolve-route-view';

/**
 * @internal Same memo boundary as the routes view renderer, so a nested branch
 * re-renders only when its own selection changes.
 */
const OutletRenderer = memo(function OutletRenderer({
  view,
  component,
}: ResolvedRouteView) {
  const outlet = useOutletValue(view);

  return (
    <OutletContext.Provider value={outlet}>
      {createElement(component)}
    </OutletContext.Provider>
  );
});

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

  return <OutletRenderer view={resolved.view} component={resolved.component} />;
};
