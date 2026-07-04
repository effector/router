import type { Route, InternalRoute } from '@effector/router';
import { createMemo, type Accessor } from 'solid-js';
import { useRouterContext } from './use-router';
import { useUnit } from 'effector-solid';

/**
 * @description Imperative navigation helper. Resolves a route to a reactive
 * `path` accessor and an `onOpen` event you can call to navigate.
 * @param to Target route (must be registered in the router)
 * @param params Accessor to the route params (reactive)
 */
export function useLink<T extends object | void = void>(
  to: Route<T>,
  params: Accessor<T> = (() => undefined) as Accessor<T>,
) {
  const { knownRoutes } = useRouterContext();
  const target = knownRoutes.find(
    ({ route }) => route === (to as unknown as InternalRoute<any>),
  );

  if (!target) {
    console.error(`[useLink route log]`, to);
    throw new Error(
      `[useLink] Route not found. Maybe it is not passed into createRouter?`,
    );
  }

  const { onOpen } = useUnit(to);

  const path = createMemo(() => target.build(params() ?? undefined));

  return {
    path,
    onOpen,
  };
}
