import { combine, createStore, type Store } from 'effector';
import { useUnit } from 'effector-vue/composition';
import {
  computed,
  defineComponent,
  h,
  type Component,
  type ComputedRef,
} from 'vue';
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
 * `<Outlet />` should render — see `resolveRouteView` in `@effector/router`
 * for the 5-step resolution order this wraps.
 *
 * @param options.hasOtherwise Whether the caller has its own fallback for
 * "nothing matched" (`createRoutesView`'s `otherwise`).
 */
export function useResolvedRouteView(
  routes: RouteView[],
  options?: { hasOtherwise?: boolean },
): ComputedRef<ResolvedRouteView | null> {
  const openedViews = useOpenedViews(routes);
  const pending = useUnit(combine(routes.map(pendingStore)));
  const hasOtherwise = options?.hasOtherwise ?? false;
  let state = createResolveRouteViewState<RouteView, Component>();
  // The last value actually handed out, so router churn that recomputes the
  // same view/component does not hand watchers a new object to react to.
  let lastReturned: ResolvedRouteView | null = null;

  return computed(() => {
    const { resolved: next, state: nextState } = resolveRouteView({
      views: routes,
      openedView: openedViews.value.at(-1),
      pending: pending.value,
      getFallback: (view) => view[routeViewFallback],
      getViewComponent: (view) => view.view,
      hasOtherwise,
      previousState: state,
    });

    state = nextState;

    lastReturned =
      lastReturned &&
      next &&
      lastReturned.view === next.view &&
      lastReturned.component === next.component
        ? lastReturned
        : next;

    return lastReturned;
  });
}
