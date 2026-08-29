import {
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentType,
  type FC,
  type ReactNode,
} from 'react';
import { combine, createStore, type Store } from 'effector';
import { useUnit } from 'effector-react';
import {
  createResolveRouteViewState,
  resolveRouteView,
  type ResolveRouteViewState,
} from '@effector/router';
import { useOpenedViews } from './use-opened-views';
import {
  routeViewFallback,
  type RouteView,
  type RouteViewFallback,
} from './types';

interface FallbackProps {
  layout?: ComponentType<{ children: ReactNode }>;
  closed?: ComponentType;
  loading?: ComponentType;
}

export interface ResolvedRouteView {
  view: RouteView;
  component: FC;
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

  const wrap = (Component: ComponentType): FC =>
    Layout
      ? () => (
          <Layout>
            <Component />
          </Layout>
        )
      : () => <Component />;

  return {
    ...(Loading ? { loading: wrap(Loading) } : {}),
    ...(Closed ? { closed: wrap(Closed) } : {}),
  };
}

export const noChildren: RouteView[] = [];

/**
 * @internal Stable `OutletContext` value for a resolved view, so a re-render of
 * the renderer does not invalidate the context for every nested consumer.
 */
export function useOutletValue(view: RouteView): { children: RouteView[] } {
  return useMemo(
    () => ({ children: view.children ?? noChildren }),
    [view.children],
  );
}

function pendingStore(view: RouteView): Store<boolean> {
  // Router targets and hand-written `{ route, view }` objects have no pending
  // state, so they never contribute a `loading` fallback.
  const { $isPending } = view.route as { $isPending?: Store<boolean> };

  return $isPending ?? $notPending;
}

/**
 * @description Reactively resolves the single view a routes view or an
 * `<Outlet />` should render — see `resolveRouteView` in `@effector/router`
 * for the 5-step resolution order this wraps.
 *
 * @param options.hasOtherwise Whether the caller has its own fallback for
 * "nothing matched" (`createRoutesView`'s `otherwise`).
 */
export function useResolvedRouteView(
  routes: RouteView[],
  options?: { hasOtherwise?: boolean },
): ResolvedRouteView | null {
  const openedViews = useOpenedViews(routes);
  const $pending = useMemo(() => combine(routes.map(pendingStore)), [routes]);
  const pending = useUnit($pending);
  const hasOtherwise = options?.hasOtherwise ?? false;

  // State as of the last render that actually committed. A render pass that
  // never commits (React 18 Strict Mode's double-invoke, an interrupted
  // concurrent render) must not leave behind a value nothing on screen ever
  // matched, so only a useLayoutEffect below may advance it.
  const committed = useRef<ResolveRouteViewState<RouteView, FC>>(
    createResolveRouteViewState(),
  );

  const { resolved, state } = useMemo(
    () =>
      resolveRouteView({
        views: routes,
        openedView: openedViews.at(-1),
        pending,
        getFallback: (view) => view[routeViewFallback],
        getViewComponent: (view) => view.view,
        hasOtherwise,
        previousState: committed.current,
      }),
    [routes, openedViews, pending, hasOtherwise],
  );

  // Router churn that does not change the selection — a sibling chain
  // starting to prepare, for example — must not hand a new object to the
  // renderer, or the whole selected branch re-renders with it.
  const lastResolved = committed.current.previous;
  const collapsed =
    lastResolved &&
    resolved &&
    lastResolved.view === resolved.view &&
    lastResolved.component === resolved.component
      ? lastResolved
      : resolved;

  useLayoutEffect(() => {
    committed.current = {
      previous: collapsed,
      hasBeenActive: state.hasBeenActive,
    };
  }, [collapsed, state.hasBeenActive]);

  return collapsed;
}
