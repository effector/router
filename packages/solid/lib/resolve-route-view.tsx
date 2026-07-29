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
  otherwise?: Component;
  loading?: Component;
}

export interface ResolvedRouteView {
  view: RouteView;
  component: Component;
}

const $notPending = createStore(false);

/**
 * @internal Wraps the `otherwise`/`loading` components with the same layout the
 * view itself uses, so a fallback never escapes its page shell. Returns
 * `undefined` when neither is declared — the symbol must stay absent then,
 * because `withLayout` copies own symbols onto its result.
 */
export function createRouteViewFallback(
  props: FallbackProps,
): RouteViewFallback | undefined {
  const { layout: Layout, otherwise: Otherwise, loading: Loading } = props;

  if (!Otherwise && !Loading) {
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
    ...(Otherwise ? { otherwise: wrap(Otherwise) } : {}),
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
 * `<Outlet />` should render: the deepest opened view when there is one,
 * otherwise the last declared fallback — `loading` of a pending route wins over
 * `otherwise` of a closed one.
 */
export function useResolvedRouteView(
  routes: RouteView[],
): Accessor<ResolvedRouteView | null> {
  const openedViews = useOpenedViews(routes);
  const pending = useUnit(combine(routes.map(pendingStore)));

  const resolve = (): ResolvedRouteView | null => {
    const openedView = openedViews().at(-1);

    if (openedView) {
      return { view: openedView, component: openedView.view };
    }

    const pendingValues = pending();
    let loading: ResolvedRouteView | null = null;
    let otherwise: ResolvedRouteView | null = null;

    for (let index = 0; index < routes.length; index += 1) {
      const view = routes[index];
      const fallback = view[routeViewFallback];

      if (!fallback) continue;

      if (fallback.loading && pendingValues[index]) {
        loading = { view, component: fallback.loading };
      } else if (fallback.otherwise) {
        otherwise = { view, component: fallback.otherwise };
      }
    }

    return loading ?? otherwise;
  };

  // Keep the identity stable while the same component stays selected, so keyed
  // consumers do not remount the page on unrelated router updates.
  return createMemo<ResolvedRouteView | null>((previous) => {
    const next = resolve();

    return previous &&
      next &&
      previous.view === next.view &&
      previous.component === next.component
      ? previous
      : next;
  }, null);
}
