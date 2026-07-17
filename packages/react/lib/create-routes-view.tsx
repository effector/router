import { type ComponentType, createElement } from 'react';
import { OutletContext } from './context';
import { useOpenedViews } from './use-opened-views';
import { layoutGroup, type LayoutGroup, type RouteView } from './types';

interface CreateRoutesViewProps {
  routes: RouteView[];
  otherwise?: ComponentType;
}

function LayoutRenderer({
  group,
  view,
}: {
  group: LayoutGroup;
  view: RouteView;
}) {
  return (
    <group.layout>
      <OutletContext.Provider value={{ children: view.children ?? [] }}>
        {createElement(view.view)}
      </OutletContext.Provider>
    </group.layout>
  );
}

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
    const openedView = useOpenedViews(routes).at(-1);

    if (!openedView) {
      return NotFound ? <NotFound /> : null;
    }

    const group = openedView[layoutGroup];

    if (group) {
      return (
        <LayoutRenderer key={group.token} group={group} view={openedView} />
      );
    }

    return (
      <OutletContext.Provider value={{ children: openedView.children ?? [] }}>
        {createElement(openedView.view)}
      </OutletContext.Provider>
    );
  };
};
