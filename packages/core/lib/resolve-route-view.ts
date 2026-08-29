/**
 * @internal Framework-agnostic priority resolution shared by the React, Solid,
 * and Vue bindings' `resolve-route-view` reactive wrappers. Each binding
 * supplies its own reactive glue (subscribing to opened/pending state,
 * identity-stable output for its renderer) around this pure algorithm, so a
 * fix to the resolution order or the transition hold only has to be made
 * once instead of copied by hand across three files.
 *
 * Resolves the single view a routes view or an `<Outlet />` should render:
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
 * Step 4 is skipped, when `hasOtherwise` is set, until something in `views`
 * has actually opened or been pending at least once — otherwise a sibling's
 * `closed` fallback would permanently shadow a declared `otherwise` for a URL
 * that never matched anything in the list.
 *
 * `resolveRouteView` itself never mutates anything: it takes the state left
 * by the previous call and returns the next one, leaving the caller free to
 * decide when that next state actually becomes "current" (a plain variable
 * for Solid/Vue's synchronous reactivity; only after a render commits for
 * React, where an in-progress render can be discarded without ever painting).
 */

export interface RouteViewFallbackShape<TComponent> {
  loading?: TComponent;
  closed?: TComponent;
}

export interface ResolvedRouteView<TView, TComponent> {
  view: TView;
  component: TComponent;
}

/**
 * The algorithm's own bookkeeping carried across calls: which view was last
 * resolved (for the transition hold) and whether the list has ever had real
 * activity (for the `otherwise` gate).
 */
export interface ResolveRouteViewState<TView, TComponent> {
  previous: ResolvedRouteView<TView, TComponent> | null;
  hasBeenActive: boolean;
}

export function createResolveRouteViewState<
  TView,
  TComponent,
>(): ResolveRouteViewState<TView, TComponent> {
  return { previous: null, hasBeenActive: false };
}

export interface ResolveRouteViewParams<TView, TComponent> {
  views: readonly TView[];
  openedView: TView | undefined;
  pending: readonly boolean[];
  getFallback: (view: TView) => RouteViewFallbackShape<TComponent> | undefined;
  getViewComponent: (view: TView) => TComponent;
  hasOtherwise: boolean;
  previousState: ResolveRouteViewState<TView, TComponent>;
}

export interface ResolveRouteViewResult<TView, TComponent> {
  resolved: ResolvedRouteView<TView, TComponent> | null;
  state: ResolveRouteViewState<TView, TComponent>;
}

export function resolveRouteView<TView, TComponent>(
  params: ResolveRouteViewParams<TView, TComponent>,
): ResolveRouteViewResult<TView, TComponent> {
  const {
    views,
    openedView,
    pending,
    getFallback,
    getViewComponent,
    hasOtherwise,
    previousState,
  } = params;

  const hasBeenActive =
    previousState.hasBeenActive || Boolean(openedView) || pending.some(Boolean);

  if (openedView) {
    const resolved = {
      view: openedView,
      component: getViewComponent(openedView),
    };

    return { resolved, state: { previous: resolved, hasBeenActive } };
  }

  let loading: ResolvedRouteView<TView, TComponent> | null = null;
  let closed: ResolvedRouteView<TView, TComponent> | null = null;

  for (let index = 0; index < views.length; index += 1) {
    const view = views[index];
    const fallback = getFallback(view);

    if (!fallback) continue;

    if (fallback.loading && pending[index]) {
      loading = { view, component: fallback.loading };
    } else if (fallback.closed) {
      closed = { view, component: fallback.closed };
    }
  }

  if (loading) {
    return { resolved: loading, state: { previous: loading, hasBeenActive } };
  }

  // Nothing in the list claims this frame outright, but a route is still
  // transitioning: hold the frame already on screen rather than falling
  // through to `closed`/`otherwise`.
  if (previousState.previous && pending.some(Boolean)) {
    return {
      resolved: previousState.previous,
      state: { previous: previousState.previous, hasBeenActive },
    };
  }

  if (closed && hasOtherwise && !hasBeenActive) {
    return { resolved: null, state: { previous: null, hasBeenActive } };
  }

  return { resolved: closed, state: { previous: closed, hasBeenActive } };
}
