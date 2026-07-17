import {
  stringifyQuery,
  type InternalRoute,
  type QueryInput,
  type Route,
} from '@effector/router';
import { useUnit } from 'effector-vue/composition';
import { toRaw } from 'vue';
import { useRouterContext } from './use-router';

/**
 * @description Imperative navigation helper. Resolves a route to its `href`
 * builder and the bound `onOpen` event. Works only inside `<RouterProvider>`
 * @link https://router.effector.dev/vue/use-link.html
 */
export function useLink<T extends object | void = void>(to: Route<T>) {
  const router = useRouterContext();
  const currentQuery = useUnit(router.$query);

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

  const { onOpen } = useUnit(route);

  return {
    build: (params?: T, query?: QueryInput) => {
      const path = target.build(params ?? undefined);
      const effectiveQuery = query === undefined ? currentQuery.value : query;
      const search = effectiveQuery
        ? stringifyQuery(effectiveQuery as QueryInput)
        : '';

      return search ? `${path}?${search}` : path;
    },
    onOpen,
  };
}
