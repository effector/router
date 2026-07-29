import { combine, createStore, type Store } from 'effector';
import { useUnit } from 'effector-vue/composition';
import {
  computed,
  defineComponent,
  h,
  type Component,
  type ComputedRef,
} from 'vue';
import { useOpenedViews } from './use-opened-views';
import {
  routeViewFallback,
  type RouteView,
  type RouteViewFallback,
} from './types';

interface FallbackProps {
  layout?: Component;
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
  const { layout, closed, loading } = props;

  if (!closed && !loading) {
    return undefined;
  }

  const wrap = (component: Component): Component =>
    layout
      ? defineComponent({
          name: 'RouteViewFallbackWithLayout',
          setup() {
            return () => h(layout, null, { default: () => h(component) });
          },
        })
      : component;

  return {
    ...(loading ? { loading: wrap(loading) } : {}),
    ...(closed ? { closed: wrap(closed) } : {}),
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
 * `closed` of a closed one.
 */
export function useResolvedRouteView(
  routes: RouteView[],
): ComputedRef<ResolvedRouteView | null> {
  const openedViews = useOpenedViews(routes);
  const pending = useUnit(combine(routes.map(pendingStore)));

  return computed(() => {
    const openedView = openedViews.value.at(-1);

    if (openedView) {
      return { view: openedView, component: openedView.view };
    }

    let loading: ResolvedRouteView | null = null;
    let closed: ResolvedRouteView | null = null;

    for (let index = 0; index < routes.length; index += 1) {
      const view = routes[index];
      const fallback = view[routeViewFallback];

      if (!fallback) continue;

      if (fallback.loading && pending.value[index]) {
        loading = { view, component: fallback.loading };
      } else if (fallback.closed) {
        closed = { view, component: fallback.closed };
      }
    }

    return loading ?? closed;
  });
}
