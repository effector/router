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
 *   loading: () => ':(',
 *   layout: MainLayout,
 * });
 * ```
 */
export function createLazyRouteView<T extends object | void = void>(
  props: CreateLazyRouteViewProps<T>,
): RouteView {
  const View = lazy(props.view);
  const { layout: Layout, children } = props;
  // One component covers both waits — the pending route and the chunk request.
  // The deprecated `fallback` is kept as its alias.
  const loading = props.loading ?? props.fallback;
  const Fallback = loading;

  const inner = () => (
    <Suspense fallback={Fallback ? <Fallback /> : null}>
      <View />
    </Suspense>
  );

  const view = Layout ? () => <Layout>{inner()}</Layout> : inner;

  const fallback = createRouteViewFallback({ ...props, loading });

  return {
    route: props.route,
    view,
    children,
    ...(fallback ? { [routeViewFallback]: fallback } : {}),
  };
}
