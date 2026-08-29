import { createMemo, type Accessor, type Component, type JSX } from 'solid-js';
import { combine, createStore, type Store } from 'effector';
import { useUnit } from 'effector-solid';
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
): Accessor<ResolvedRouteView | null> {
  const openedViews = useOpenedViews(routes);
  const pending = useUnit(combine(routes.map(pendingStore)));
  const hasOtherwise = options?.hasOtherwise ?? false;

  // Plain (non-reactive) box for the last definite resolution — an opened
  // view, a `loading` fallback, or a `closed` fallback. It is deliberately
  // left untouched when neither applies, so an intermediate recompute with
  // nothing to show does not erase what a later pending tick should hold.
  let previous: ResolvedRouteView | null = null;
  // Whether any route in the list has ever opened or been pending, so step 4
  // can tell a route that was genuinely visited from one that never matched.
  let hasBeenActive = false;

  const resolve = (): ResolvedRouteView | null => {
    const openedView = openedViews().at(-1);
    const pendingValues = pending();

    if (openedView || pendingValues.some(Boolean)) {
      hasBeenActive = true;
    }

    if (openedView) {
      previous = { view: openedView, component: openedView.view };
      return previous;
    }

    let loading: ResolvedRouteView | null = null;
    let closed: ResolvedRouteView | null = null;

    for (let index = 0; index < routes.length; index += 1) {
      const view = routes[index];
      const fallback = view[routeViewFallback];

      if (!fallback) continue;

      if (fallback.loading && pendingValues[index]) {
        loading = { view, component: fallback.loading };
      } else if (fallback.closed) {
        closed = { view, component: fallback.closed };
      }
    }

    if (loading) {
      previous = loading;
      return loading;
    }

    // Nothing in the list claims this frame outright, but a route is still
    // transitioning: hold the frame already on screen rather than falling
    // through to `closed`/`otherwise`.
    if (previous && pendingValues.some(Boolean)) {
      return previous;
    }

    if (closed && hasOtherwise && !hasBeenActive) {
      return null;
    }

    if (closed) {
      previous = closed;
    }

    return closed;
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
