import { lazy, Suspense } from 'solid-js';
import { createRouteViewFallback } from './resolve-route-view';
import {
  routeViewFallback,
  type CreateLazyRouteViewProps,
  type RouteView,
} from './types';

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
  const View = lazy(props.view);
  const { layout: Layout, children } = props;
  // `loading` covers both waits, so it also feeds Suspense unless the
  // chunk-only `fallback` is declared explicitly.
  const Fallback = props.fallback ?? props.loading;

  const inner = () => (
    <Suspense fallback={Fallback ? <Fallback /> : null}>
      <View />
    </Suspense>
  );

  const view = Layout ? () => <Layout>{inner()}</Layout> : inner;

  const fallback = createRouteViewFallback(props);

  return {
    route: props.route,
    view,
    children,
    ...(fallback ? { [routeViewFallback]: fallback } : {}),
  };
}
