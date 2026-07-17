import { scopeBind, type Scope } from 'effector';

type OpenableRoute = {
  open?: () => void;
  close?: () => void;
};

type PreventableEvent = { preventDefault: () => void };
type ClosingEvent = { data: { closing: boolean } };

function bindRouteUnit<T extends (...args: any[]) => any>(
  unit: T | undefined,
  scope?: Scope | null,
): T | undefined {
  if (!unit) return undefined;
  return (scope ? scopeBind(unit, { scope }) : unit) as T;
}

function openRoute(route: unknown, scope?: Scope | null): void {
  if (
    route &&
    typeof route === 'object' &&
    'open' in route &&
    typeof (route as OpenableRoute).open === 'function'
  ) {
    bindRouteUnit((route as OpenableRoute).open, scope)?.();
  }
}

function closeRoute(route: unknown, scope?: Scope | null): void {
  if (
    route &&
    typeof route === 'object' &&
    'close' in route &&
    typeof (route as OpenableRoute).close === 'function'
  ) {
    bindRouteUnit((route as OpenableRoute).close, scope)?.();
  }
}

export function createRouteListeners(
  route: unknown,
  scope?: Scope | null,
): {
  focus: () => void;
  beforeRemove: (event: PreventableEvent) => void;
  gestureEnd: () => void;
} {
  return {
    focus: () => openRoute(route, scope),
    beforeRemove: (event) => {
      event.preventDefault();
      closeRoute(route, scope);
    },
    gestureEnd: () => closeRoute(route, scope),
  };
}

export function createClosingTransitionListener(
  route: unknown,
  scope?: Scope | null,
): (event: ClosingEvent) => void {
  return (event) => {
    if (event.data.closing) {
      closeRoute(route, scope);
    }
  };
}

export function createTabPressListener(
  route: unknown,
  scope?: Scope | null,
): (event: PreventableEvent) => void {
  return (event) => {
    event.preventDefault();
    openRoute(route, scope);
  };
}

export { closeRoute, openRoute };
