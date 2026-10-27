import { is, type InternalRoute } from '@effector/router';
import { useUnit } from 'effector-vue/composition';
import { computed, type ComputedRef } from 'vue';
import type { RouteView } from './types';

/**
 * @description Reactively resolves which of the passed views should be rendered
 * for the current router state. Nested (parent) routes are filtered out in favor
 * of their children, mirroring `@effector/router-react` behaviour.
 * @link https://router.effector.dev/vue/use-opened-views.html
 */
export function useOpenedViews(routes: RouteView[]): ComputedRef<RouteView[]> {
  // The stores go to `useUnit` as a list: a derived store per mount would stay
  // linked to the route stores after unmount.
  const states = useUnit(
    routes.map((view) =>
      is.router(view.route) ? view.route.$activeRoutes : view.route.$isOpened,
    ),
  );

  return computed(() => {
    const filtered = routes.filter((view, index) => {
      const value = states[index].value;

      return is.router(view.route)
        ? (value as unknown[]).length > 0
        : Boolean(value);
    });

    return filtered.reduce(
      (result, view) =>
        result.filter(
          (candidate) =>
            candidate.route !== (view.route as InternalRoute<any>).parent,
        ),
      filtered,
    );
  });
}
