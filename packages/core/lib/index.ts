export { createRoute } from './create-route';
export { createRouter } from './create-router';
export { chainRoute } from './chain-route';
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
  Router,
  Query,
  OpenPayloadBase,
  RouteOpenedPayload,
  NavigatePayload,
  QueryTracker,
  QueryTrackerConfig,
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
