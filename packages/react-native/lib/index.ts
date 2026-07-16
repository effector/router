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
} from '@effector/router-react';

export type {
  CreateLazyRouteViewProps,
  CreateRouteViewProps,
  RouteView,
} from '@effector/router-react';

export { createStackNavigator } from './stack-navigator';
export { createBottomTabsNavigator } from './bottom-tabs-navigator';
export type { NativeNavigator, NativeNavigatorProps } from './native-navigator';

export type {
  StackNavigatorConfig,
  StackNavigatorOptions,
  StackRouteView,
} from './stack-navigator';

export type {
  BottomTabsNavigatorConfig,
  BottomTabNavigationOptions,
  BottomTabsRouteView,
} from './bottom-tabs-navigator';
