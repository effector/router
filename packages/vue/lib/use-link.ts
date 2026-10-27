import {
  stringifyQuery,
  type InternalRoute,
  type QueryInput,
  type Route,
  type RouteOpenPayload,
} from '@effector/router';
import { scopeBind } from 'effector';
import { useProvidedScope, useUnit } from 'effector-vue/composition';
import { computed, toRaw } from 'vue';
import { useRouterContext } from './use-router';

/**
 * @description Imperative navigation helper. Resolves a route to its `href`
 * builder and the bound `onOpen` event. Works only inside `<RouterProvider>`
 * @link https://router.effector.dev/vue/use-link.html
 */
export function useLink<T extends object | void = void>(to: Route<T>) {
  return useLinkTo(() => to);
}

/**
 * @internal `useLink` with the route read on every use, so that `<Link>`
 * follows a new `to` prop.
 */
export function useLinkTo<T extends object | void = void>(
  getTo: () => Route<T>,
) {
  const router = useRouterContext();
  const currentQuery = useUnit(router.$query);
  // Resolved here, in setup: a click handler has no injection context.
  const scope = useProvidedScope();

  const resolve = (to: Route<T>) => {
    // `to` may arrive as a Vue reactive proxy (e.g. from component props);
    // unwrap it so the identity check against knownRoutes works.
    const route = toRaw(to);

    const target = router.knownRoutes.find(
      // `known` may itself be a reactive proxy (e.g. when the router is provided
      // through deeply-reactive props), so compare the raw targets.
      ({ route: known }) =>
        toRaw(known) === (route as unknown as InternalRoute<any>),
    );

    if (!target) {
      throw new Error(
        '[useLink] Route not found. Maybe it is not passed into createRouter?',
      );
    }

    const { onOpen } = route['@@unitShape']();

    return {
      target,
      onOpen: scope ? scopeBind(onOpen, { scope }) : onOpen,
    };
  };

  // An unknown route still throws in setup, not on the first render.
  resolve(getTo());

  const link = computed(() => resolve(getTo()));

  return {
    build: (params?: T, query?: QueryInput) => {
      const path = link.value.target.build(params ?? undefined);
      const effectiveQuery = query === undefined ? currentQuery.value : query;
      const search = effectiveQuery ? stringifyQuery(effectiveQuery) : '';

      return search ? `${path}?${search}` : path;
    },
    onOpen: (payload: RouteOpenPayload<T>) => link.value.onOpen(payload),
  };
}
