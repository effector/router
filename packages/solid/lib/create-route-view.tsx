import { createRouteViewFallback } from './resolve-route-view';
import {
  routeViewFallback,
  type CreateRouteViewProps,
  type RouteView,
} from './types';

/**
 * @description Creates Route view without async bundle load
 * @link https://router.effector.dev/solid/create-route-view.html
 * @param props Route view props
 * @returns RouteView
 * @example ```ts
 * import { createRouteView } from '@effector/router-solid';
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
