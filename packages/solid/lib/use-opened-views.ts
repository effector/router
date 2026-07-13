import { createMemo, type Accessor } from 'solid-js';
import type { RouteView } from './types';
import type { InternalRoute } from '@effector/router';
import { is } from '@effector/router';
import { useUnit } from 'effector-solid';

/**
 * @description Reactive accessor with the currently opened views out of the
 * provided list. Parent views are filtered out when a child view is opened, so
 * only the deepest matching branch remains.
 */
export function useOpenedViews(routes: RouteView[]): Accessor<RouteView[]> {
  const visibilities = routes.map<Accessor<boolean>>((view) => {
    if (is.router(view.route)) {
      const activeRoutes = useUnit(view.route.$activeRoutes);
      return () => activeRoutes().length > 0;
    }

    return useUnit(view.route.$isOpened);
  });

  return createMemo(() => {
    const filtered = routes.filter((_, index) => visibilities[index]());

    return filtered.reduce(
      (acc, view) =>
        acc.filter(
          (r) => r.route !== (view.route as InternalRoute<any>).parent,
        ),
      filtered,
    );
  });
}
