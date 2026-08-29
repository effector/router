export { createRoute } from './create-route';
export { createRouter } from './create-router';
export { chainRoute, type ChainRouteProps } from './chain-route';
export { createRouterControls } from './create-router-controls';
export { group } from './group';
export { createVirtualRoute } from './create-virtual-route';
export {
  beforeNavigate,
  type BeforeNavigateConfig,
  type BeforeNavigateResult,
} from './before-navigate';
export { redirect, type RedirectConfig } from './redirect';

export type {
  Route,
  PathRoute,
  PathlessRoute,
  ChainRoute,
  Router,
  Query,
  QueryInput,
  QueryValue,
  QueryParametersInput,
  OpenPayloadBase,
  RouteOpenPayload,
  RouteOpenedPayload,
  RouteUpdatedPayload,
  NavigatePayload,
  QueryTracker,
  QueryTrackerState,
  QueryTrackerConfig,
  TrackQueryConfig,
  VirtualRoute,
  MappedRoute,
  InternalRoute,
} from './types';

export {
  historyAdapter,
  queryAdapter,
  type RouterAdapter,
  type RouterLocation,
} from './adapters';

export { is } from './utils';
export { isEqualQuery, parseQuery, stringifyQuery } from './query-codec';
export { trackQuery } from './track-query';

/**
 * @internal Shared by the React, Solid, and Vue bindings' `resolve-route-view`
 * modules. Not part of the router's documented public API — the framework
 * bindings are its only supported consumers.
 */
export {
  createResolveRouteViewState,
  resolveRouteView,
  type ResolvedRouteView,
  type ResolveRouteViewParams,
  type ResolveRouteViewState,
  type RouteViewFallbackShape,
} from './resolve-route-view';
