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
 * Carries the algorithm's own bookkeeping across calls: which view was last
 * resolved (for the transition hold) and whether the list has ever had real
 * activity (for the `otherwise` gate). One instance belongs to one
 * `resolveRouteView` call site — create it once per component instance/setup
 * and reuse it across every call.
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
  state: ResolveRouteViewState<TView, TComponent>;
}

export function resolveRouteView<TView, TComponent>(
  params: ResolveRouteViewParams<TView, TComponent>,
): ResolvedRouteView<TView, TComponent> | null {
  const {
    views,
    openedView,
    pending,
    getFallback,
    getViewComponent,
    hasOtherwise,
    state,
  } = params;

  if (openedView || pending.some(Boolean)) {
    state.hasBeenActive = true;
  }

  if (openedView) {
    state.previous = {
      view: openedView,
      component: getViewComponent(openedView),
    };
    return state.previous;
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
    state.previous = loading;
    return loading;
  }

  // Nothing in the list claims this frame outright, but a route is still
  // transitioning: hold the frame already on screen rather than falling
  // through to `closed`/`otherwise`.
  if (state.previous && pending.some(Boolean)) {
    return state.previous;
  }

  if (closed && hasOtherwise && !state.hasBeenActive) {
    state.previous = null;
    return null;
  }

  state.previous = closed;
  return closed;
}
