import { is, type Route, type Router } from '@effector/router';
import { useUnit } from 'effector-solid';
import { createMemo, type Accessor } from 'solid-js';

/**
 * @description Reactive accessor telling whether a route (or any route of a
 * router) is currently opened.
 */
export function useIsOpened(
  route: Pick<Route<any>, '$isOpened'> | Router,
): Accessor<boolean> {
  if (is.router(route)) {
    const activeRoutes = useUnit(route.$activeRoutes);
    return createMemo(() => activeRoutes().length > 0);
  }

  return useUnit(route.$isOpened);
}
