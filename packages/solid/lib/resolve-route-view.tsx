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
 */
export function useResolvedRouteView(
  routes: RouteView[],
): Accessor<ResolvedRouteView | null> {
  const openedViews = useOpenedViews(routes);
  const pending = useUnit(combine(routes.map(pendingStore)));

  // Plain (non-reactive) box for the last definite resolution — an opened
  // view, a `loading` fallback, or a `closed` fallback. It is deliberately
  // left untouched when neither applies, so an intermediate recompute with
  // nothing to show does not erase what a later pending tick should hold.
  let previous: ResolvedRouteView | null = null;

  const resolve = (): ResolvedRouteView | null => {
    const openedView = openedViews().at(-1);

    if (openedView) {
      previous = { view: openedView, component: openedView.view };
      return previous;
    }

    const pendingValues = pending();
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
