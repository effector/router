import type { QueryInput, Route } from '@effector/router';
import type { InternalRoute } from '@effector/router';
import { useRouterContext } from './use-router';
import { useUnit } from 'effector-react';
import queryString from 'query-string';

export function useLink<T extends object | void = void>(
  to: Route<T>,
  params: T,
  query?: QueryInput,
) {
  const { knownRoutes } = useRouterContext();
  const router = useRouterContext();
  const currentQuery = useUnit(router.$query);
  const target = knownRoutes.find(
    ({ route }) => route === (to as unknown as InternalRoute<any>),
  );

  const { onOpen } = useUnit(to);

  if (!target) {
    console.error(`[useLink route log]`, to);
    throw new Error(
      `[useLink] Route not found. Maybe it is not passed into createRouter?`,
    );
  }

  return {
    path: createHref(
      target.build(params ?? undefined),
      query === undefined ? currentQuery : query,
    ),
    onOpen,
  };
}

function createHref(path: string, query?: QueryInput): string {
  const search = query ? queryString.stringify(query) : '';

  return search ? `${path}?${search}` : path;
}
