import { useMemo } from 'react';
import { combine } from 'effector';
import { useUnit } from 'effector-react';
import { is, type InternalRoute } from '@effector/router';
import type { RouteView } from './types';

/**
 * @description Reactively resolves which of the passed views should be rendered
 * for the current router state. Parent views are filtered out in favor of their
 * children, so only the deepest matching branch remains.
 *
 * Subscription goes through effector-react `useUnit` (backed by
 * `useSyncExternalStore`), mirroring the Solid and Vue bindings — the render
 * layer owns subscription, scope, and teardown, so there is no render-vs-effect
 * gap, tearing, or hydration mismatch.
 */
export function useOpenedViews(routes: RouteView[]): RouteView[] {
  const $visibilities = useMemo(
    () =>
      combine(
        routes.map((view) =>
          is.router(view.route)
            ? view.route.$activeRoutes
            : view.route.$isOpened,
        ),
        (values) =>
          values.map((value, index) =>
            is.router(routes[index].route)
              ? (value as unknown[]).length > 0
              : Boolean(value),
          ),
      ),
    [routes],
  );

  const visibilities = useUnit($visibilities);

  return useMemo(() => {
    const filtered = routes.filter((_, index) => visibilities[index]);

    return filtered.reduce(
      (result, view) =>
        result.filter(
          (candidate) =>
            candidate.route !== (view.route as InternalRoute<any>).parent,
        ),
      filtered,
    );
  }, [routes, visibilities]);
}
