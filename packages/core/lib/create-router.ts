import {
  attach,
  createEvent,
  createStore,
  merge,
  sample,
  scopeBind,
} from 'effector';
import type {
  InternalPathlessRoute,
  InternalPathRoute,
  InternalRoute,
  InternalRouter,
  MappedRoute,
  PathlessRoute,
  PathRoute,
  Route,
  Router,
  RouterControls,
} from './types';

import { compile } from '@effector/router-paths';
import { createRouterControls } from './create-router-controls';
import { createAction } from 'effector-action';
import { is } from './utils';
import {
  type InternalNavigatePayload,
  type InternalRouterControls,
  navigationKind,
} from './navigation';
import { isEqualQuery } from './query-codec';

type InputRoute =
  | PathRoute<any>
  | { path: string; route: PathlessRoute<any> }
  | Router;

interface RouterConfig {
  base?: string;
  routes: InputRoute[];
  controls?: RouterControls;
  notFound?: PathlessRoute<any>;
}

const inputIs = {
  pathlessRoute(
    route: InputRoute,
  ): route is { path: string; route: PathlessRoute<any> } {
    return 'route' in route;
  },

  pathRoute(route: InputRoute): route is PathRoute<any> {
    return !this.pathlessRoute(route) && !this.router(route);
  },

  router(route: InputRoute): route is Router {
    return is.router(route);
  },
};

/**
 * @description Creates router
 * @param config Router config
 * @returns `Router`
 * @link https://router.effector.dev/core/create-router.html
 *
 * `be careful! router need to be initialzed with setHistory event,
 * which requires memory or browser history from history package.`
 *
 * @example ```ts
 * import { createRouter } from '@effector/router';
 * import { routes } from './routes';
 *
 * // create router
 * const router = createRouter({
 *   routes: [routes.route1, routes.route2],
 * });
 *
 * // override path or query
 * sample({
 *  clock: goToPage,
 *  fn: () => ({ path: '/page' }),
 *  target: router.navigate,
 * });
 *
 * sample({
 *  clock: addQuery,
 *  fn: () => ({ query: { param1: 'hello', params2: [1, 2] } }),
 *  target: router.navigate,
 * });
 *
 * ```
 */
export function createRouter(config: RouterConfig): Router {
  const { base = '/', routes, notFound } = config;
  const internalNotFound = notFound as InternalPathlessRoute<any> | undefined;
  const controls = (config.controls ??
    createRouterControls()) as InternalRouterControls;
  const {
    $path,
    $query,
    $history,
    back,
    forward,
    navigationFailed,
    navigate,
    setHistory,
    initialized,
    updated,
    locationUpdated,
    locationInitialized,
  } = controls;

  function getPathWithBase(path: string) {
    if (base === '/') {
      return path;
    }

    return path === '/' ? base : `${base}${path}`;
  }

  const connectToParentRouter = createEvent<Router>();

  let parent: Router | null = null;

  const knownRoutes: MappedRoute[] = [];
  const nestedRouters: InternalRouter[] = [];
  const $lastMatchedPath = createStore<string | null>(null);
  const $lastMatchedQuery = createStore<import('./types').Query>({});
  const $lastMatchedCount = createStore(0);

  function mapRoute(inputRoute: InputRoute): MappedRoute | null {
    if (inputIs.pathlessRoute(inputRoute)) {
      const { build, parse } = compile<string, any>(
        getPathWithBase(inputRoute.path),
      );

      const route = {
        route: inputRoute.route as InternalPathlessRoute<any>,
        path: inputRoute.path,
        build,
        parse,
      };

      controls.internal.registerRoute(inputRoute.route, parse);

      return route;
    }

    if (inputIs.router(inputRoute)) {
      sample({
        clock: setHistory,
        target: inputRoute.setHistory,
      });

      return null;
    }

    let internalRoute = inputRoute as InternalPathRoute<any>;
    const path: string[] = [];

    path.unshift(internalRoute.path);

    while (internalRoute.parent) {
      if (is.pathlessRoute(internalRoute.parent)) {
        break;
      }

      internalRoute = internalRoute.parent as InternalPathRoute<any>;

      if (internalRoute.path !== '/') {
        path.unshift(internalRoute.path);
      }
    }

    const joinedPath = getPathWithBase(path.join(''));

    const { build, parse } = compile<string, any>(joinedPath);

    const route = {
      route: inputRoute as InternalRoute<any>,
      path: joinedPath,
      build,
      parse,
    };

    controls.internal.registerRoute(inputRoute, parse);

    return route;
  }

  const ownRoutes = routes.reduce<MappedRoute[]>((acc, inputRoute) => {
    const mappedRoute = mapRoute(inputRoute);

    if (mappedRoute) {
      knownRoutes.push(mappedRoute);
      acc.push(mappedRoute);
    }

    if (inputIs.router(inputRoute)) {
      nestedRouters.push(inputRoute as InternalRouter);
      knownRoutes.push(...inputRoute.knownRoutes);
    }

    return acc;
  }, []);

  type RouteMatch = {
    route: InternalRoute<any>;
    params: Record<string, string>;
  };

  type MatchResult = {
    matches: RouteMatch[];
    activeRoutes: Route<any>[];
    nestedHandled: boolean;
  };

  function isWithinBase(path: string, routerBase: string | undefined) {
    const normalizedBase = routerBase && routerBase !== '/' ? routerBase : '';

    return (
      normalizedBase === '' ||
      path === normalizedBase ||
      path.startsWith(`${normalizedBase}/`)
    );
  }

  function handlesPath(path: string) {
    const result = matchRoutes(path);

    return (
      result.matches.length > 0 ||
      (internalNotFound !== undefined && isWithinBase(path, base)) ||
      nestedRouters.some((router) => router.internal.handlesPath(path))
    );
  }

  function matchRoutes(path: string | null): MatchResult {
    if (!path) {
      return { matches: [], activeRoutes: [], nestedHandled: false };
    }

    const matches: RouteMatch[] = [];

    for (const { route, parse } of ownRoutes) {
      const matchResult = parse(path);

      if (matchResult) {
        matches.push({ route, params: matchResult.params });
      }
    }

    return {
      matches,
      activeRoutes: matches.map(({ route }) => route),
      nestedHandled: nestedRouters.some((router) =>
        router.internal.handlesPath(path),
      ),
    };
  }

  const $activeRoutes = $path.map((path) => {
    const result = matchRoutes(path);

    return path &&
      isWithinBase(path, base) &&
      result.matches.length === 0 &&
      !result.nestedHandled &&
      notFound
      ? [notFound]
      : result.activeRoutes;
  });

  const openRoutesByPathFx = attach({
    source: {
      query: $query,
      path: $path,
      previousPath: $lastMatchedPath,
      previousQuery: $lastMatchedQuery,
      previousCount: $lastMatchedCount,
    },
    effect: ({ query, path, previousPath, previousQuery, previousCount }) => {
      if (!path) {
        return { path, query, count: 0 };
      }

      const { matches } = matchRoutes(path);
      const matchedRoutes = new Set(matches.map(({ route }) => route));
      const isPathChange = previousPath !== path;
      const queryOnly = !isPathChange && !isEqualQuery(previousQuery, query);
      // A same-path, same-query commit is a genuine re-navigation to the
      // identical URL (e.g. re-opening the current route) and re-activates
      // matching routes.
      const isSameUrlReNavigation =
        !isPathChange && isEqualQuery(previousQuery, query);
      // The first commit that matches a route after matching none.
      const isInitialMatch = previousCount === 0 && matches.length > 0;
      // Re-activate matching routes on a new path, an identical-URL re-entry, or
      // the initial match. A query-only change (queryOnly) is observed through
      // `$query`/query trackers and must not re-activate routes (D3.4).
      const shouldNavigate =
        isPathChange || isSameUrlReNavigation || isInitialMatch;

      // A parent route stays open while any of its children is active, so a
      // nested URL (e.g. `/profile/friends`) keeps `/profile` open even though
      // the parent pattern does not match the full path. Treating ancestors of
      // matched routes as active prevents the parent from flickering
      // closed→open when switching between sibling children.
      const activeRoutes = new Set<InternalRoute<any>>(matchedRoutes);

      for (const { route } of matches) {
        let ancestor = (route as InternalRoute<any>).parent as
          | InternalRoute<any>
          | undefined;

        while (ancestor) {
          activeRoutes.add(ancestor);
          ancestor = ancestor.parent as InternalRoute<any> | undefined;
        }
      }

      for (const { route } of ownRoutes) {
        const routeClose = scopeBind(route.internal.close, { safe: true });

        if (!activeRoutes.has(route)) {
          routeClose();
        }
      }

      for (const { route, params } of matches) {
        if (!shouldNavigate) {
          continue;
        }

        const routeNavigate = scopeBind(route.internal.navigated, {
          safe: true,
        });
        routeNavigate({
          query,
          params,
        });
      }

      if (internalNotFound && (!queryOnly || matches.length > 0)) {
        const notFoundClose = scopeBind(internalNotFound.internal.close, {
          safe: true,
        });

        if (
          shouldNavigate &&
          isWithinBase(path, base) &&
          matches.length === 0 &&
          !nestedRouters.some((router) => router.internal.handlesPath(path))
        ) {
          const notFoundNavigate = scopeBind(
            internalNotFound.internal.navigated,
            {
              safe: true,
            },
          );
          notFoundNavigate({ query });
        } else {
          notFoundClose();
        }
      }

      return { path, query, count: matches.length };
    },
  });

  $lastMatchedPath.on(openRoutesByPathFx.doneData, (_, { path }) => path);
  $lastMatchedQuery.on(openRoutesByPathFx.doneData, (_, { query }) => query);
  $lastMatchedCount.on(openRoutesByPathFx.doneData, (_, { count }) => count);

  function registerRouteApi({ route, build }: MappedRoute) {
    createAction({
      clock: route.internal.openFx.doneData,
      target: { navigate },
      fn: (target, payload) => {
        if (payload?.navigate === false) {
          return;
        }

        const navigateParams: InternalNavigatePayload = {
          path: build(
            payload && 'params' in payload ? payload.params : undefined,
          ),
        };

        if (payload?.replace !== undefined) {
          navigateParams.replace = payload.replace;
        }

        if (payload && 'query' in payload && payload.query !== undefined) {
          navigateParams.query = payload.query;
        }

        const internalPayload = payload as
          | Record<PropertyKey, unknown>
          | undefined;

        if (internalPayload?.[navigationKind] === 'redirect') {
          navigateParams[navigationKind] = 'redirect';
        }

        return target.navigate(navigateParams);
      },
    });
  }

  for (const route of ownRoutes) {
    registerRouteApi(route);
  }

  sample({
    clock: merge([locationUpdated, locationInitialized]),
    fn: (location) => ({
      path: location.pathname,
      query: location.query,
    }),
    target: openRoutesByPathFx,
  });

  const router = {
    '@@type': 'router',

    $query,
    $path,
    $history,
    notFound,

    $activeRoutes,

    back,
    forward,
    navigationFailed,

    navigate,

    setHistory,
    initialized,
    updated,
    ownRoutes,
    knownRoutes,

    internal: {
      connectToParentRouter,

      get parent() {
        return parent;
      },

      set parent(router: Router | null) {
        parent = router;
      },

      base,
      handlesPath,
    },

    registerRoute: (route: InputRoute) => {
      const mappedRoute = mapRoute(route);

      if (mappedRoute) {
        knownRoutes.push(mappedRoute);
        ownRoutes.push(mappedRoute);

        registerRouteApi(mappedRoute);
      }

      if (inputIs.router(route)) {
        knownRoutes.push(...route.knownRoutes);
      }
    },

    '@@unitShape': () => ({
      query: $query,
      path: $path,
      activeRoutes: $activeRoutes,

      onBack: back,
      onForward: forward,
      onNavigate: navigate,
    }),
  } as InternalRouter;

  return router;
}
