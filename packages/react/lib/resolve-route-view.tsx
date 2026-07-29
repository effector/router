import { useMemo, type ComponentType, type FC, type ReactNode } from 'react';
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
  otherwise?: ComponentType;
  loading?: ComponentType;
}

export interface ResolvedRouteView {
  view: RouteView;
  component: FC;
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
 * @description Reactively resolves the single view a routes view or an
 * `<Outlet />` should render: the deepest opened view when there is one,
 * otherwise the last declared fallback — `loading` of a pending route wins over
 * `otherwise` of a closed one.
 */
export function useResolvedRouteView(
  routes: RouteView[],
): ResolvedRouteView | null {
  const openedViews = useOpenedViews(routes);
  const $pending = useMemo(() => combine(routes.map(pendingStore)), [routes]);
  const pending = useUnit($pending);

  return useMemo(() => {
    const openedView = openedViews.at(-1);

    if (openedView) {
      return { view: openedView, component: openedView.view };
    }

    let loading: ResolvedRouteView | null = null;
    let otherwise: ResolvedRouteView | null = null;

    for (let index = 0; index < routes.length; index += 1) {
      const view = routes[index];
      const fallback = view[routeViewFallback];

      if (!fallback) continue;

      if (fallback.loading && pending[index]) {
        loading = { view, component: fallback.loading };
      } else if (fallback.otherwise) {
        otherwise = { view, component: fallback.otherwise };
      }
    }

    return loading ?? otherwise;
  }, [routes, openedViews, pending]);
}
