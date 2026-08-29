import {
  useMemo,
  useRef,
  type ComponentType,
  type FC,
  type ReactNode,
} from 'react';
import { combine, createStore, type Store } from 'effector';
import { useUnit } from 'effector-react';
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
 * `<Outlet />` should render:
 *
 * 1. the deepest opened view, if one of the listed views is opened;
 * 2. otherwise the `loading` of a pending view;
 * 3. otherwise the previously resolved view, while any listed route is still
 *    pending — closing the previous route and opening the next one is not
 *    atomic, and this holds the frame already on screen through that gap
 *    instead of tearing it down for a fallback that belongs to an unrelated
 *    view;
 * 4. otherwise the `closed` of a closed view;
 * 5. otherwise `null`.
 *
 * @param options.hasOtherwise Whether the caller has its own fallback for
 * "nothing matched" (`createRoutesView`'s `otherwise`). When set, step 4 is
 * skipped until something in `routes` has actually opened or been pending at
 * least once — otherwise a sibling's `closed` fallback would permanently
 * shadow `otherwise` for a URL that never matched anything in this list.
 */
export function useResolvedRouteView(
  routes: RouteView[],
  options?: { hasOtherwise?: boolean },
): ResolvedRouteView | null {
  const openedViews = useOpenedViews(routes);
  const $pending = useMemo(() => combine(routes.map(pendingStore)), [routes]);
  const pending = useUnit($pending);
  // Router churn that does not change the selection — a sibling chain starting
  // to prepare, for example — must not hand a new object to the renderer, or
  // the whole selected branch re-renders with it.
  const previous = useRef<ResolvedRouteView | null>(null);
  // Whether any route in the list has ever opened or been pending, so step 4
  // can tell a route that was genuinely visited from one that never matched.
  const hasBeenActive = useRef(false);
  const hasOtherwise = options?.hasOtherwise ?? false;

  const resolved = useMemo(() => {
    const openedView = openedViews.at(-1);

    if (openedView || pending.some(Boolean)) {
      hasBeenActive.current = true;
    }

    if (openedView) {
      return { view: openedView, component: openedView.view };
    }

    let loading: ResolvedRouteView | null = null;
    let closed: ResolvedRouteView | null = null;

    for (let index = 0; index < routes.length; index += 1) {
      const view = routes[index];
      const fallback = view[routeViewFallback];

      if (!fallback) continue;

      if (fallback.loading && pending[index]) {
        loading = { view, component: fallback.loading };
      } else if (fallback.closed) {
        closed = { view, component: fallback.closed };
      }
    }

    if (loading) {
      return loading;
    }

    // Nothing in the list claims this frame outright, but a route is still
    // transitioning: hold the frame already on screen rather than falling
    // through to `closed`/`otherwise`.
    if (previous.current && pending.some(Boolean)) {
      return previous.current;
    }

    if (closed && hasOtherwise && !hasBeenActive.current) {
      return null;
    }

    return closed;
  }, [routes, openedViews, pending, hasOtherwise]);

  const last = previous.current;

  if (
    last &&
    resolved &&
    last.view === resolved.view &&
    last.component === resolved.component
  ) {
    return last;
  }

  previous.current = resolved;

  return resolved;
}
