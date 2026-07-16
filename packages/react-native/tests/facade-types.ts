export {
  Outlet,
  RouterProvider,
  createLazyRouteView,
  createRouteView,
  createRoutesView,
  useIsOpened,
  useOpenedViews,
  useRouter,
  useRouterContext,
  withLayout,
} from '../lib';

export type {
  CreateLazyRouteViewProps,
  CreateRouteViewProps,
  RouteView,
} from '../lib';

// @ts-expect-error browser-only bindings are imported from @effector/router-react
export { Link, useLink } from '../lib';

// @ts-expect-error browser-only types are imported from @effector/router-react
export type { LinkProps } from '../lib';

// @ts-expect-error core units are imported from @effector/router
export { createRoute, createRouter } from '../lib';

// @ts-expect-error core types are imported from @effector/router
export type { Route, Router } from '../lib';
