import { combine } from 'effector';
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
  const $visibilities = combine(
    routes.map((view) =>
      is.router(view.route) ? view.route.$activeRoutes : view.route.$isOpened,
    ),
    (values) =>
      values.map((value, index) =>
        is.router(routes[index].route)
          ? (value as unknown[]).length > 0
          : Boolean(value),
      ),
  );

  const visibilities = useUnit($visibilities);

  return computed(() => {
    const filtered = routes.filter((_, index) => visibilities.value[index]);

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
