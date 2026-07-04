import { Show, type Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { OutletContext } from './context';
import { useOpenedViews } from './use-opened-views';
import type { RouteView } from './types';

interface CreateRoutesViewProps {
  routes: RouteView[];
  otherwise?: Component;
}

/**
 * @description Create routes view which renders current opened route. `Don't forget add <RouterProvider>`!
 * @param props Routes view config
 * @link https://router.effector.dev/solid/create-routes-view.html
 * @returns RoutesView
 * @example ```tsx
 * import { createRoutesView } from '@effector/router-solid';
 * import { router } from './router';
 * // feed screen & profile screen must be created with createRouteView!
 * import { FeedScreen, ProfileScreen } from './screens';
 *
 * const RoutesView = createRoutesView({ routes: [FeedScreen, ProfileScreen] });
 *
 * // then you can use it like a Solid component:
 * function App() {
 *   return (
 *     <RouterProvider router={router}>
 *       <RoutesView />
 *     </RouterProvider>
 *   );
 * }
 * ```
 */
export function createRoutesView(props: CreateRoutesViewProps) {
  const { routes, otherwise: NotFound } = props;

  return () => {
    const openedViews = useOpenedViews(routes);
    const openedView = () => openedViews().at(-1);

    return (
      <Show when={openedView()} fallback={NotFound ? <NotFound /> : null} keyed>
        {(view) => (
          <OutletContext.Provider value={{ children: view.children ?? [] }}>
            <Dynamic component={view.view} />
          </OutletContext.Provider>
        )}
      </Show>
    );
  };
}
