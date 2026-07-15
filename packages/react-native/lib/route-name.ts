function getPath(route: unknown): string | undefined {
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

export function getScreenName(route: unknown, index: number): string {
  return getPath(route) || `Route${index}`;
}

export function getScreenKey(route: unknown, index: number): string {
  return getPath(route) || `route-${index}`;
}

export function getScreenTitle(route: unknown, index: number): string {
  const pathParts = getPath(route)?.split('/').filter(Boolean) ?? [];

  return pathParts.at(-1) || `Route ${index + 1}`;
}
