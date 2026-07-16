import { Show, useContext } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { OutletContext } from './context';
import { useOpenedViews } from './use-opened-views';

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
  const openedViews = useOpenedViews(children);
  const openedView = () => openedViews().at(-1);

  return (
    <Show when={openedView()} keyed>
      {(view) => (
        <OutletContext.Provider value={{ children: view.children ?? [] }}>
          <Dynamic component={view.view} />
        </OutletContext.Provider>
      )}
    </Show>
  );
}
