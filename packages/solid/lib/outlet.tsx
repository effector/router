import { Show, useContext } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { OutletContext } from './context';
import { useResolvedRouteView } from './resolve-route-view';

/**
 * @description Outlet component for nested routes
 * @link https://router.effector.dev/solid/outlet.html
 * @example ```tsx
 * export const RoutesView = createRoutesView({
 *   routes: [
 *     createRouteView({
 *       route: routes.profile,
 *       view: ProfileScreen,
 *       children: [
 *         createRouteView({ route: routes.settings, view: SettingsScreen }),
 *       ],
 *     }),
 *   ],
 * });
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
export function Outlet() {
  const { children } = useContext(OutletContext);
  const resolved = useResolvedRouteView(children);

  return (
    <Show when={resolved()} keyed>
      {(current) => (
        <OutletContext.Provider
          value={{ children: current.view.children ?? [] }}
        >
          <Dynamic component={current.component} />
        </OutletContext.Provider>
      )}
    </Show>
  );
}
