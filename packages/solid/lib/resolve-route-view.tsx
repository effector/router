import { createMemo, type Accessor, type Component, type JSX } from 'solid-js';
import { combine, createStore, type Store } from 'effector';
import { useUnit } from 'effector-solid';
import {
  createResolveRouteViewState,
  resolveRouteView,
} from '@effector/router';
import { useOpenedViews } from './use-opened-views';
import {
  routeViewFallback,
  type RouteView,
  type RouteViewFallback,
} from './types';

interface FallbackProps {
  layout?: Component<{ children: JSX.Element }>;
  closed?: Component;
  loading?: Component;
}

export interface ResolvedRouteView {
  view: RouteView;
  component: Component;
}

const $notPending = createStore(false);

/**
 * @internal Wraps the `closed`/`loading` components with the same layout the
 * view itself uses, so a fallback never escapes its page shell. Returns
 * `undefined` when neither is declared — the symbol must stay absent then,
 * because `withLayout` copies own symbols onto its result.
 */
export function createRouteViewFallback(
  props: FallbackProps,
): RouteViewFallback | undefined {
  const { layout: Layout, closed: Closed, loading: Loading } = props;

  if (!Closed && !Loading) {
    return undefined;
  }

  const wrap = (Component: Component): Component =>
    Layout
      ? () => (
          <Layout>
            <Component />
          </Layout>
        )
      : Component;

  return {
    ...(Loading ? { loading: wrap(Loading) } : {}),
    ...(Closed ? { closed: wrap(Closed) } : {}),
  };
}

function pendingStore(view: RouteView): Store<boolean> {
  // Router targets and hand-written `{ route, view }` objects have no pending
  // state, so they never contribute a `loading` fallback.
  const { $isPending } = view.route as { $isPending?: Store<boolean> };

  return $isPending ?? $notPending;
}

/**
 * @description Reactive accessor with the single view a routes view or an
 * `<Outlet />` should render — see `resolveRouteView` in `@effector/router`
 * for the 5-step resolution order this wraps.
 *
 * @param options.hasOtherwise Whether the caller has its own fallback for
 * "nothing matched" (`createRoutesView`'s `otherwise`).
 */
export function useResolvedRouteView(
  routes: RouteView[],
  options?: { hasOtherwise?: boolean },
): Accessor<ResolvedRouteView | null> {
  const openedViews = useOpenedViews(routes);
  const pending = useUnit(combine(routes.map(pendingStore)));
  const hasOtherwise = options?.hasOtherwise ?? false;
  let state = createResolveRouteViewState<RouteView, Component>();

  const resolve = (): ResolvedRouteView | null => {
    const { resolved, state: nextState } = resolveRouteView({
      views: routes,
      openedView: openedViews().at(-1),
      pending: pending(),
      getFallback: (view) => view[routeViewFallback],
      getViewComponent: (view) => view.view,
      hasOtherwise,
      previousState: state,
    });

    state = nextState;

    return resolved;
  };

  // Keep the identity stable while the same component stays selected, so keyed
  // consumers do not remount the page on unrelated router updates.
  return createMemo<ResolvedRouteView | null>((last) => {
    const next = resolve();

    return last &&
      next &&
      last.view === next.view &&
      last.component === next.component
      ? last
      : next;
  }, null);
}
