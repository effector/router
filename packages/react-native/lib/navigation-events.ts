type OpenableRoute = {
  open?: () => void;
};

function openRoute(route: unknown): void {
  if (
    route &&
    typeof route === 'object' &&
    'open' in route &&
    typeof (route as OpenableRoute).open === 'function'
  ) {
    (route as OpenableRoute).open?.();
  }
}

export function createRouteListeners(route: unknown): { focus: () => void } {
  return {
    focus: () => openRoute(route),
  };
}

export { openRoute };
