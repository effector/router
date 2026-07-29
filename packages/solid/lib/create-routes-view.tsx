import { Show, type Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { OutletContext } from './context';
import { useResolvedRouteView } from './resolve-route-view';
import { layoutGroup, type RouteView } from './types';

interface CreateRoutesViewProps {
  routes: RouteView[];
  otherwise?: Component;
}

function LayoutRenderer(props: {
  view: RouteView;
  component: Component;
  group: NonNullable<RouteView[typeof layoutGroup]>;
}) {
  return (
    <Dynamic component={props.group.layout}>
      <OutletContext.Provider value={{ children: props.view.children ?? [] }}>
        <Dynamic component={props.component} />
      </OutletContext.Provider>
    </Dynamic>
  );
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
    const resolved = useResolvedRouteView(routes);

    return (
      <Show when={resolved()} fallback={NotFound ? <NotFound /> : null}>
        {(current) => {
          const group = () => current().view[layoutGroup];

          return (
            <Show
              when={group()}
              fallback={
                <OutletContext.Provider
                  value={{ children: current().view.children ?? [] }}
                >
                  <Dynamic component={current().component} />
                </OutletContext.Provider>
              }
            >
              {(layout) => (
                <LayoutRenderer
                  view={current().view}
                  component={current().component}
                  group={layout()}
                />
              )}
            </Show>
          );
        }}
      </Show>
    );
  };
}
