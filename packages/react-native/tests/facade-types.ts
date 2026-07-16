export {
  Outlet,
  RouterProvider,
  createLazyRouteView,
  createRoute,
  createRouteView,
  createRouter,
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
  Route,
  RouteView,
  Router,
} from '../lib';

// @ts-expect-error browser-only values are intentionally not re-exported
export { Link, useLink } from '../lib';

// @ts-expect-error browser-only props are intentionally not re-exported
export type { LinkProps } from '../lib';
