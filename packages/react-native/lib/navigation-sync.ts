import type { Route } from '@effector/router';
import type { RouteView } from '@effector/router-react';
import type { Router } from '@effector/router';
import { createWatch, type Scope } from 'effector';
import { getScreenName } from './route-name';

export type NativeNavigation = {
  navigate: (name: string, params?: unknown) => void;
  replace?: (name: string, params?: unknown) => void;
};

export type RouterNavigationIntent = {
  route: Route<any>;
  params?: unknown;
  replace?: boolean;
};

export function syncActiveRoute(
  navigation: NativeNavigation,
  activeRoutes: readonly Route<any>[],
  routes: RouteView[],
  intent?: RouterNavigationIntent,
): void {
  const activeRoute = intent?.route ?? activeRoutes.at(-1);

  if (!activeRoute) {
    return;
  }

  const index = routes.findIndex((view) => view.route === activeRoute);

  if (index >= 0) {
    const name = getScreenName(routes[index].route, index);
    const params = intent?.params;

    if (intent?.replace && navigation.replace) {
      if (params === undefined) navigation.replace(name);
      else navigation.replace(name, params);
    } else {
      if (params === undefined) navigation.navigate(name);
      else navigation.navigate(name, params);
    }
  }
}

type RouterSyncConfig = {
  router: Router;
  routes: RouteView[];
  navigation: NativeNavigation;
  scope?: Scope;
};

type NativeSnapshotLike = {
  route?: { name?: string; params?: unknown };
};

function getParams(route: Route<any>, scope?: Scope): unknown {
  const params = scope?.getState(route.$params) ?? route.$params.getState();

  return params &&
    typeof params === 'object' &&
    Object.keys(params).length === 0
    ? undefined
    : params;
}

function keyForIntent(intent: RouterNavigationIntent): string {
  return JSON.stringify([
    getScreenName(intent.route, 0),
    intent.params ?? null,
    Boolean(intent.replace),
  ]);
}

function sameParams(left: unknown, right: unknown): boolean {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

/**
 * Keep the latest Router snapshot and apply it only after native readiness.
 * This is deliberately private: Router remains the source of truth and the
 * binding exposes no bridge unit or command queue.
 */
export function createRouterSync(config: RouterSyncConfig): {
  onSnapshot: (snapshot: NativeSnapshotLike) => void;
  cleanup: () => void;
} {
  const { router, routes, navigation, scope } = config;
  let ready = false;
  let latest: RouterNavigationIntent | undefined;
  let currentNative: NativeSnapshotLike | undefined;
  let lastCommand: string | undefined;

  const apply = () => {
    if (!ready || !latest) {
      return;
    }

    const index = routes.findIndex((view) => view.route === latest?.route);
    if (index < 0) {
      return;
    }

    const name = getScreenName(routes[index].route, index);
    if (
      currentNative?.route?.name === name &&
      sameParams(currentNative.route.params, latest.params)
    ) {
      lastCommand = undefined;
      return;
    }

    const commandKey = keyForIntent(latest);
    if (lastCommand === commandKey) {
      return;
    }

    lastCommand = commandKey;
    syncActiveRoute(navigation, [latest.route], routes, latest);
  };

  const updateActive = (activeRoutes: readonly Route<any>[]) => {
    const route = activeRoutes.at(-1);
    if (!route) {
      return;
    }

    latest = { route, params: getParams(route, scope) };
    apply();
  };

  const subscriptions = [
    createWatch({
      unit: router.$activeRoutes,
      scope: scope ?? undefined,
      fn: updateActive,
    }),
    ...routes
      .flatMap(({ route }) => ('opened' in route ? [route as Route<any>] : []))
      .map((route) =>
        createWatch({
          unit: route.opened,
          scope: scope ?? undefined,
          fn: (payload) => {
            latest = {
              route,
              params:
                payload && typeof payload === 'object' && 'params' in payload
                  ? payload.params
                  : getParams(route, scope),
              replace:
                payload && typeof payload === 'object' && 'replace' in payload
                  ? (payload.replace as boolean | undefined)
                  : undefined,
            };
            apply();
          },
        }),
      ),
  ];

  return {
    onSnapshot(snapshot) {
      currentNative = snapshot;
      ready = true;
      apply();
    },
    cleanup() {
      subscriptions.forEach((subscription) => subscription.unsubscribe());
    },
  };
}
