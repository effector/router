import { lazy, Suspense } from 'solid-js';
import { is } from '@effector/router';
import type { InternalRoute } from '@effector/router';
import type { CreateLazyRouteViewProps, RouteView } from './types';

/**
 * @description Creates Lazy route view with async bundle load
 * @link https://router.effector.dev/solid/create-lazy-route-view.html
 * @param props Lazy route view props
 * @returns RouteView
 * @example ```ts
 * // profile.tsx
 * export default function () {
 *   return <>...</>;
 * }
 *
 * // index.ts
 * import { createLazyRouteView } from '@effector/router-solid';
 * import { routes } from '@shared/routing';
 * import { MainLayout } from '@layouts';
 *
 * export const ProfileScreen = createLazyRouteView({
 *   route: routes.profile,
 *   view: () => import('./profile'),
 *   fallback: () => ':(',
 *   layout: MainLayout,
 * });
 * ```
 */
export function createLazyRouteView<T extends object | void = void>(
  props: CreateLazyRouteViewProps<T>,
): RouteView {
  if (!is.router(props.route)) {
    (props.route as InternalRoute<T>).internal.setAsyncImport(props.view);
  }

  const View = lazy(props.view);
  const { layout: Layout, fallback: Fallback, children } = props;

  const inner = () => (
    <Suspense fallback={Fallback ? <Fallback /> : null}>
      <View />
    </Suspense>
  );

  const view = Layout ? () => <Layout>{inner()}</Layout> : inner;

  return {
    route: props.route,
    view,
    children,
  };
}
