import { getParamNames, getRequiredParamNames } from '@effector/router-paths';

function getOwnPath(route: unknown): string | undefined {
  if (
    !route ||
    typeof route !== 'object' ||
    !('path' in route) ||
    typeof route.path !== 'string'
  ) {
    return undefined;
  }

  return route.path;
}

export function getRegisteredPath(route: unknown): string | undefined {
  const path = getOwnPath(route);
  const parent =
    route && typeof route === 'object' && 'parent' in route
      ? (route as { parent?: unknown }).parent
      : undefined;
  const parentPath = parent ? getRegisteredPath(parent) : undefined;

  if (!parentPath) {
    return path;
  }

  if (!path || path === '/') {
    return parentPath;
  }

  return `${parentPath.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function hasRouteParams(route: unknown): boolean {
  return getParamNames(getRegisteredPath(route) ?? '').length > 0;
}

export function hasRequiredRouteParams(route: unknown): boolean {
  return getRequiredParamNames(getRegisteredPath(route) ?? '').length > 0;
}

export function getScreenName(route: unknown, index: number): string {
  void index;
  const path = getRegisteredPath(route);

  if (!path) {
    throw new Error(
      '[react-native] Every navigator route must have a registered path template',
    );
  }

  return path;
}

export function getScreenKey(route: unknown, index: number): string {
  return getScreenName(route, index);
}

export function getScreenTitle(route: unknown, index: number): string {
  const pathParts = getScreenName(route, index).split('/').filter(Boolean);

  return pathParts.at(-1) ?? '';
}

export function validateInitialRouteName(
  routes: readonly { route: unknown }[],
  initialRouteName: string | undefined,
): void {
  if (!initialRouteName) {
    return;
  }

  const routeView = routes.find(
    (view, index) => getScreenName(view.route, index) === initialRouteName,
  );

  if (routeView && hasRequiredRouteParams(routeView.route)) {
    throw new Error(
      `[react-native] initialRouteName "${initialRouteName}" refers to a route with required params`,
    );
  }
}

export function validateBottomTabsRoutes(
  routes: readonly { route: unknown }[],
): void {
  const parameterized = routes.find((view) => hasRouteParams(view.route));

  if (parameterized) {
    throw new Error(
      `[react-native] Bottom Tabs cannot register parameterized route "${getScreenName(parameterized.route, 0)}"`,
    );
  }
}
