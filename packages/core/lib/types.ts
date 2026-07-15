import type {
  Effect,
  Event,
  EventCallable,
  Store,
  StoreWritable,
} from 'effector';

import type { z, ZodType } from 'zod/v4';

import type { Builder, Parser } from '@effector/router-paths';
import type { RouterAdapter } from './adapters';

export type QueryValue = string | null | Array<string | null>;

export type Query = Record<string, QueryValue>;

export type QueryInput = Record<string, QueryValue | undefined>;

export type QueryParametersInput<ParametersConfig extends ZodType> = Partial<
  Record<Extract<keyof z.input<ParametersConfig>, string>, QueryValue>
>;

export interface PathlessRoute<T extends object | void = void> {
  '@@type': 'pathless-route';

  $params: Store<T>;

  $isOpened: Store<boolean>;
  $isPending: Store<boolean>;

  open: EventCallable<RouteOpenPayload<T>>;

  opened: Event<RouteOpenedPayload<T>>;
  openedOnServer: Event<RouteOpenedPayload<T>>;
  openedOnClient: Event<RouteOpenedPayload<T>>;
  updated: Event<RouteOpenedPayload<T>>;

  close: EventCallable<void>;
  closed: Event<void>;

  parent?: PathRoute<any> | PathlessRoute<any>;
  /** @deprecated Compose post-commit preparation with `chainRoute` instead. */
  beforeOpen?: Effect<any, any, any>[];

  '@@unitShape': () => {
    params: Store<T>;
    isOpened: Store<boolean>;
    isPending: Store<boolean>;

    onOpen: EventCallable<RouteOpenPayload<T>>;
  };
}

export interface PathRoute<T extends object | void = void> extends Omit<
  PathlessRoute<T>,
  '@@type'
> {
  '@@type': 'path-route';

  path: string;
}

export type Route<T extends object | void = void> =
  | PathRoute<T>
  | PathlessRoute<T>;

export type QueryTrackerConfig<ParametersConfig extends ZodType> = {
  routes?: Route<any>[];
  parameters: ParametersConfig;
};

export type TrackQueryConfig<ParametersConfig extends ZodType> =
  QueryTrackerConfig<ParametersConfig> & {
    controls: RouterControls;
  };

export interface QueryTracker<ParametersConfig extends ZodType> {
  entered: Event<z.output<ParametersConfig>>;
  exited: Event<void>;

  enter: EventCallable<QueryParametersInput<ParametersConfig>>;
  exit: EventCallable<{ ignoreParams: string[] } | void>;
}

export type OpenPayloadBase = {
  query?: QueryInput;
  replace?: boolean;
};

export type RouteOpenedPayload<T> = T extends void
  ? void | OpenPayloadBase
  : { params: T } & OpenPayloadBase;

export type RouteOpenPayload<T> = T extends void
  ?
      | RouteOpenedPayload<T>
      | (OpenPayloadBase & { params: Record<string, never> })
  : RouteOpenedPayload<T>;

export type NavigatePayload = {
  query?: QueryInput;
  path?: string;
  replace?: boolean;
};

export type NavigationFailure =
  | {
      operation: 'navigate';
      reason: 'not-initialized';
      payload: NavigatePayload;
    }
  | {
      operation: 'back' | 'forward';
      reason: 'not-initialized';
    };

export type MappedRoute = {
  route: InternalRoute<any>;
  path: string;
  build: Builder<any>;
  parse: Parser<any>;
};

export interface Router {
  '@@type': 'router';

  $query: Store<Query>;
  $path: Store<string | null>;
  $history: Store<RouterAdapter | null>;
  $activeRoutes: Store<Route<any>[]>;

  notFound?: PathlessRoute<any>;

  back: EventCallable<void>;
  forward: EventCallable<void>;
  navigate: EventCallable<NavigatePayload>;

  navigationFailed: Event<NavigationFailure>;

  setHistory: EventCallable<RouterAdapter>;

  initialized: Event<LocationState>;
  updated: Event<LocationState>;

  /**
   * @description Creates query params tracker
   * @param config Query tacker config
   * @link https://router.effector.dev/core/track-query.html
   * @example ```ts
   * import { parameters } from '@effector/router';
   * import { router } from '@shared/router';
   * import { createDialog } from '...';
   *
   * const dialog = createDialog();
   * const tracker = router.trackQuery({
   *   dialog: 'team-member',
   *   id: parameters.number,
   * });
   *
   * // triggered for:
   * // /team?dialog=team-member&id=1
   * // /team?dialog=team-member&id=10000
   *
   * // not triggered for:
   * // /team?dialog=team&id=1
   * // /team?id=10000
   * // /team?dialog=team&id=not_number
   * ```
   */
  ownRoutes: MappedRoute[];
  knownRoutes: MappedRoute[];

  registerRoute: (
    route:
      | PathRoute<any>
      | { path: string; route: PathlessRoute<any> }
      | Router,
  ) => void;

  '@@unitShape': () => {
    query: Store<Query>;
    path: Store<string | null>;
    activeRoutes: Store<Route<any>[]>;

    onBack: EventCallable<void>;
    onForward: EventCallable<void>;
    onNavigate: EventCallable<NavigatePayload>;
  };
}

export interface InternalRouterProps {
  parent: Router | null;
  base?: string;
  handlesPath: (path: string) => boolean;
}

export interface InternalRouter extends Router {
  internal: InternalRouterProps;
}

type InternalOpenedPayload<T> = RouteOpenedPayload<T> & {
  navigate?: boolean;
  parent?: boolean;
};

export interface InternalRouteParams<T> {
  close: EventCallable<void>;
  navigated: EventCallable<RouteOpenedPayload<T>>;
  openFx: Effect<InternalOpenedPayload<T>, InternalOpenedPayload<T>, Error>;
  forceOpenParentFx: Effect<
    InternalOpenedPayload<T>,
    InternalOpenedPayload<T>,
    Error
  >;
}

export interface InternalPathlessRoute<
  T extends object | void = any,
> extends PathlessRoute<T> {
  internal: InternalRouteParams<T>;
}

export interface InternalPathRoute<
  T extends object | void = any,
> extends PathRoute<T> {
  internal: InternalRouteParams<T>;
}

export type InternalRoute<T extends object | void = any> =
  | InternalPathRoute<T>
  | InternalPathlessRoute<T>;

/** @deprecated Internal compatibility shape for the old two-argument virtual route. */
export interface LegacyVirtualRoute<T, TransformerResult> {
  '@@type': 'pathless-route';

  $params: StoreWritable<TransformerResult>;

  $isOpened: StoreWritable<boolean>;
  $isPending: Store<boolean>;

  open: EventCallable<T>;
  opened: Event<T>;

  openedOnServer: Event<T>;
  openedOnClient: Event<T>;

  close: EventCallable<void>;
  closed: Event<void>;

  cancelled: Event<void>;

  path: string;
  '@@unitShape': () => {
    params: Store<TransformerResult>;
    isOpened: Store<boolean>;
    isPending: Store<boolean>;

    onOpen: EventCallable<T>;
    onClose: EventCallable<void>;
  };
}

interface LegacyVirtualRouteMarker {
  readonly __legacyVirtualRoute?: unique symbol;
}

/**
 * @deprecated The two-argument form is retained for `createVirtualRoute` and
 * `chainRoute` compatibility. Use `createRoute<Params>()` for new virtual
 * routes.
 */
export type VirtualRoute<
  T = void,
  TransformerResult = LegacyVirtualRouteMarker,
> = TransformerResult extends LegacyVirtualRouteMarker
  ? T extends object | void
    ? PathlessRoute<T>
    : never
  : LegacyVirtualRoute<T, TransformerResult>;

export type LocationState = { path: string | null; query: Query };

export interface RouterControls {
  $history: StoreWritable<RouterAdapter | null>;
  $locationState: StoreWritable<LocationState>;

  $query: Store<Query>;
  $path: Store<string | null>;

  setHistory: EventCallable<RouterAdapter>;

  initialized: Event<LocationState>;
  updated: Event<LocationState>;

  navigate: EventCallable<NavigatePayload>;

  navigationFailed: Event<NavigationFailure>;

  back: EventCallable<void>;
  forward: EventCallable<void>;

  locationUpdated: EventCallable<{
    pathname: string;
    query: Query;
  }>;

  /**
   * @description Creates query params tracker
   * @param config Query tacker config
   * @link https://router.effector.dev/core/track-query.html
   * @example ```ts
   * import { z } from 'zod/v4';
   * import { router } from '@shared/router';
   * import { createDialog } from '...';
   *
   * const dialog = createDialog();
   * const tracker = router.trackQuery({
   *  parameters: {
   *    dialog: z.literal('team-member'),
   *    id: z.cource.number(),
   *  },
   * });
   *
   * // triggered for:
   * // /team?dialog=team-member&id=1
   * // /team?dialog=team-member&id=10000
   *
   * // not triggered for:
   * // /team?dialog=team&id=1
   * // /team?id=10000
   * // /team?dialog=team&id=not_number
   * ```
   */
}
