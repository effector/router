export {
  Outlet,
  RouterProvider,
  createLazyRouteView,
  createRouteView,
  createRoutesView,
  Link,
  useIsOpened,
  useLink,
  useOpenedViews,
  useRouter,
  useRouterContext,
  withLayout,
} from '../lib';

export type {
  CreateLazyRouteViewProps,
  CreateRouteViewProps,
  LinkProps,
  RouteView,
} from '../lib';

// @ts-expect-error core units are imported from @effector/router
export { createRoute, createRouter } from '../lib';

// @ts-expect-error core types are imported from @effector/router
export type { Route, Router } from '../lib';
