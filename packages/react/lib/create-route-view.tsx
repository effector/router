import { createRouteViewFallback } from './resolve-route-view';
import {
  routeViewFallback,
  type CreateRouteViewProps,
  type RouteView,
} from './types';

/**
 * @description Creates Route view without async bundle load
 * @link https://router.effector.dev/react/create-route-view.html
 * @param props Route view props
 * @returns RouteView
 * @example ```ts
 * import { createRouteView } from '@effector/router-react';
 * import { routes } from '@shared/routing';
 * import { MainLayout } from '@layouts';
 *
 * function Profile() {
 *   return <>...</>;
 * }
 *
 * export const ProfileScreen = createRouteView({
 *   route: routes.profile,
 *   view: Profile,
 *   layout: MainLayout,
 *   loading: ProfileSkeleton,
 *   closed: ProfilePlaceholder,
 * });
 * ```
 */
export function createRouteView<T extends object | void = void>(
  props: CreateRouteViewProps<T>,
): RouteView {
  const { layout: Layout, view: View, children } = props;

  const view = Layout
    ? () => (
        <Layout>
          <View />
        </Layout>
      )
    : () => <View />;

  const fallback = createRouteViewFallback(props);

  return {
    route: props.route,
    view,
    children,
    ...(fallback ? { [routeViewFallback]: fallback } : {}),
  };
}
