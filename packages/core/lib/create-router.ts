import { attach, createEvent, merge, sample, scopeBind } from 'effector';
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
import { trackQueryFactory } from './track-query';

import { compile } from '@effector/router-paths';
import { createRouterControls } from './create-router-controls';
import { createAction } from 'effector-action';
import { is } from './utils';
import {
  type InternalNavigatePayload,
  type InternalRouterControls,
  navigationKind,
} from './navigation';

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
    source: { query: $query, path: $path },
    effect: ({ query, path }) => {
      if (!path) {
        return;
      }

      const { matches } = matchRoutes(path);
      const matchedRoutes = new Set(matches.map(({ route }) => route));

      for (const { route } of ownRoutes) {
        const routeClose = scopeBind(route.internal.close, { safe: true });

        if (!matchedRoutes.has(route)) {
          routeClose();
        }
      }

      for (const { route, params } of matches) {
        const routeNavigate = scopeBind(route.internal.navigated, {
          safe: true,
        });
        routeNavigate({
          query,
          params,
        });
      }

      if (internalNotFound) {
        const notFoundClose = scopeBind(internalNotFound.internal.close, {
          safe: true,
        });

        if (
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
    },
  });

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

    trackQuery: trackQueryFactory({ $activeRoutes, $query, navigate }),

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
