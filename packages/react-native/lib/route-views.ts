import type { RouteView } from '@effector/router-react';

export function flattenRouteViews(routes: RouteView[]): RouteView[] {
  return routes.flatMap((route) => [
    route,
    ...flattenRouteViews(route.children ?? []),
  ]);
}
