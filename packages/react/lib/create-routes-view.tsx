import { type ComponentType, createElement, memo } from 'react';
import { OutletContext } from './context';
import {
  useOutletValue,
  useResolvedRouteView,
  type ResolvedRouteView,
} from './resolve-route-view';
import { layoutGroup, type RouteView } from './types';

interface CreateRoutesViewProps {
  routes: RouteView[];
  otherwise?: ComponentType;
}

/**
 * @internal Renders the resolved component — the view itself, or its `loading`
 * / `closed` fallback — inside the layout group of the view it belongs to.
 * Memoized: the selection is identity-stable, so unrelated router updates stop
 * at this boundary instead of re-rendering the whole page branch.
 */
const ViewRenderer = memo(function ViewRenderer({
  view,
  component,
}: ResolvedRouteView) {
  const outlet = useOutletValue(view);
  const group = view[layoutGroup];
  const content = (
    <OutletContext.Provider value={outlet}>
      {createElement(component)}
    </OutletContext.Provider>
  );

  return group ? <group.layout>{content}</group.layout> : content;
});

/**
 * @description Create routes view which renders current opened route. `Don't forget add <RouterProvider>`!
 * @param props Routes view config
 * @link https://router.effector.dev/react/create-routes-view.html
 * @returns RoutesView
 * @example ```tsx
 * import { createRoutesView } from '@effector/router-react';
 * import { router } from './router';
 * // feed screen & profile screen must be created with createRouteView!
 * import { FeedScreen, ProfileScreen } from './screens';
 *
 * const RoutesView = createRoutesView({ routes: [FeedScreen, ProfileScreen] });
 *
 * // then you can use it like react component:
 * function App() {
 *   return (
 *     <RouterProvider router={router}>
 *       <RoutesView />
 *     </RouterProvider>
 *   );
 * }
 * ```
 */
export const createRoutesView = (props: CreateRoutesViewProps) => {
  const { routes, otherwise: NotFound } = props;

  return () => {
    const resolved = useResolvedRouteView(routes);

    if (!resolved) {
      return NotFound ? <NotFound /> : null;
    }

    return (
      <ViewRenderer
        key={resolved.view[layoutGroup]?.token}
        view={resolved.view}
        component={resolved.component}
      />
    );
  };
};
