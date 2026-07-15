import type { Route } from '@effector/router';
import type { RouteView } from '@effector/router-react';
import { getScreenName } from './route-name';

type NativeNavigation = {
  navigate: (name: string) => void;
};

export function syncActiveRoute(
  navigation: NativeNavigation,
  activeRoutes: readonly Route<any>[],
  routes: RouteView[],
): void {
  const activeRoute = activeRoutes.at(-1);

  if (!activeRoute) {
    return;
  }

  const index = routes.findIndex((view) => view.route === activeRoute);

  if (index >= 0) {
    navigation.navigate(getScreenName(routes[index].route, index));
  }
}
