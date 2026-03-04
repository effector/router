import { is, type Route, type Router } from '@effector/router';
import { useUnit } from 'effector-react';

export function useIsOpened(route: Route | Router) {
  return is.router(route)
    ? useUnit(route.$activeRoutes).length > 0
    : useUnit(route.$isOpened);
}
