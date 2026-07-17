import {
  attach,
  createEffect,
  createEvent,
  createStore,
  merge,
  sample,
  type Subscription,
} from 'effector';

import { createAsyncAction } from 'effector-action';

import type {
  LocationState,
  NavigatePayload,
  NavigationFailure,
  Query,
  Route,
  RouterControls,
} from './types';
import type { RouterAdapter, RouterTransition } from './adapters';
import {
  type InternalNavigatePayload,
  type InternalRouterControls,
  type NavigationRequest,
  navigationKind,
} from './navigation';
import { createAttemptCoordinator } from './transition-attempt';
import type { TransitionAttempt } from './transition-attempt';
import { isEqualQuery, parseQuery, stringifyQuery } from './query-codec';

const MAX_REDIRECT_DEPTH = 16;

function isEqualLocation(left: LocationState, right: LocationState): boolean {
  return left.path === right.path && isEqualQuery(left.query, right.query);
}

interface NavigationState {
  attemptId: number;
  collected: boolean;
  holds: number[];
}

/**
 * Creates navigation controls. Policy operators can be declared next to routes
 * while history itself is attached later in the application layer.
 */
export function createRouterControls(): RouterControls {
  const $history = createStore<RouterAdapter | null>(null, {
    serialize: 'ignore',
  });

  const $locationState = createStore<LocationState>(
    {
      query: {},
      path: null,
    },
    {
      updateFilter: (next, current) => !isEqualLocation(next, current),
    },
  );

  const $subscription = createStore<Subscription | null>(null, {
    serialize: 'ignore',
  });
  const $blockSubscription = createStore<Subscription | null>(null, {
    serialize: 'ignore',
  });

  const $query = $locationState.map((state) => state.query);
  const $path = $locationState.map((state) => state.path);

  const setHistory = createEvent<RouterAdapter>();
  const initialized = createEvent<LocationState>();
  const updated = createEvent<LocationState>();
  const navigate = createEvent<NavigatePayload>();
  const back = createEvent();
  const forward = createEvent();
  const navigationFailed = createEvent<NavigationFailure>();

  const locationUpdated = createEvent<{
    pathname: string;
    query: Query;
  }>();
  const locationInitialized = createEvent<{
    pathname: string;
    query: Query;
  }>();
  const nativeNavigationRequested = createEvent<RouterTransition>();

  const coordinator = createAttemptCoordinator<NavigationRequest>({
    concurrency: 'ignore',
    shouldReplace: (_, next) => next.redirect,
  });

  const hold = createEvent<{ attemptId: number; ownerId: number }>();
  const proceed = createEvent<number>();
  const cancel = createEvent<number>();
  const commit = createEvent<number>();

  const $navigationState = createStore<NavigationState | null>(null, {
    serialize: 'ignore',
  })
    .on(coordinator.started, (_, attempt) => ({
      attemptId: attempt.id,
      collected: false,
      holds: [],
    }))
    .on(hold, (state, payload) => {
      if (
        !state ||
        state.attemptId !== payload.attemptId ||
        state.holds.includes(payload.ownerId)
      ) {
        return state;
      }

      return { ...state, holds: [...state.holds, payload.ownerId] };
    })
    .reset([coordinator.completed, coordinator.cancelled]);

  const collectHoldsFx = createEffect(async (attemptId: number) => {
    await Promise.resolve();
    return attemptId;
  });

  sample({
    clock: coordinator.started,
    fn: ({ id }) => id,
    target: collectHoldsFx,
  });

  const collectionFinished = sample({
    clock: collectHoldsFx.doneData,
    source: $navigationState,
    filter: (state, attemptId): state is NavigationState =>
      state?.attemptId === attemptId,
    fn: (state): NavigationState => ({
      ...(state as NavigationState),
      collected: true,
    }),
  });

  $navigationState.on(collectionFinished, (_, state) => state);

  sample({
    clock: collectionFinished,
    filter: (state) => state.holds.length === 0,
    fn: (state) => state.attemptId,
    target: commit,
  });

  const holdReleased = sample({
    clock: proceed,
    source: $navigationState,
    filter: (state, ownerId): state is NavigationState =>
      Boolean(state?.holds.includes(ownerId)),
    fn: (state, ownerId): NavigationState => ({
      ...(state as NavigationState),
      holds: (state as NavigationState).holds.filter((id) => id !== ownerId),
    }),
  });

  $navigationState.on(holdReleased, (_, state) => state);

  sample({
    clock: holdReleased,
    filter: (state) => state.collected && state.holds.length === 0,
    fn: (state) => state.attemptId,
    target: commit,
  });

  sample({
    clock: cancel,
    source: $navigationState,
    filter: (state, ownerId) => Boolean(state?.holds.includes(ownerId)),
    fn: (state) => state!.attemptId,
    target: coordinator.cancel,
  });

  const committing = sample({
    clock: commit,
    source: coordinator.$current,
    filter: (attempt, attemptId): attempt is NonNullable<typeof attempt> =>
      attempt?.id === attemptId,
    fn: (attempt) => attempt as TransitionAttempt<NavigationRequest>,
  });

  sample({
    clock: committing,
    fn: ({ id }) => id,
    target: coordinator.complete,
  });

  const navigateFx = attach({
    source: $history,
    effect: (history, request: NavigationRequest) => {
      if (!history) throw new Error('history not found');

      const { path, query, replace } = request.navigation;
      const target = {
        pathname: path,
        search: stringifyQuery(query) ? `?${stringifyQuery(query)}` : '',
      };

      if (replace) history.replace(target);
      else history.push(target);
    },
  });

  const retryNativeFx = createEffect((request: NavigationRequest) => {
    request.transition?.retry();
  });

  sample({
    clock: committing,
    filter: ({ payload }) => payload.kind === 'command',
    fn: ({ payload }) => payload,
    target: navigateFx,
  });

  sample({
    clock: committing,
    filter: ({ payload }) => payload.kind === 'native',
    fn: ({ payload }) => payload,
    target: retryNativeFx,
  });

  const initializedNavigate = sample({
    clock: navigate,
    source: $history,
    filter: Boolean,
    fn: (_, payload) => payload,
  });

  sample({
    clock: navigate,
    source: $history,
    filter: (history): history is null => history === null,
    fn: (_, payload): NavigationFailure => ({
      operation: 'navigate',
      reason: 'not-initialized',
      payload,
    }),
    target: navigationFailed,
  });

  const commandCandidate = sample({
    clock: initializedNavigate,
    source: $locationState,
    fn: (location, payload) => {
      const internalPayload = payload as InternalNavigatePayload;

      return {
        from: location.path ?? '/',
        navigation: {
          path: payload.path ?? location.path ?? '/',
          query: payload.query ?? location.query,
          replace: payload.replace,
        },
        kind: 'command',
        redirect: internalPayload[navigationKind] === 'redirect',
        redirectDepth: 0,
      } satisfies NavigationRequest;
    },
  });

  const nativeCandidate = sample({
    clock: nativeNavigationRequested,
    source: $locationState,
    fn: (location, transition) =>
      ({
        from: location.path ?? '/',
        navigation: {
          path: transition.location.pathname,
          query: parseQuery(transition.location.search),
          replace: transition.action === 'REPLACE',
        },
        kind: 'native',
        redirect: false,
        redirectDepth: 0,
        transition,
      }) satisfies NavigationRequest,
  });

  const candidate = merge([commandCandidate, nativeCandidate]);

  const classifiedCandidate = sample({
    clock: candidate,
    source: coordinator.$current,
    fn: (current, next) => {
      const redirectDepth = next.redirect
        ? (current?.payload.redirectDepth ?? 0) + 1
        : 0;

      return {
        accepted: !next.redirect || redirectDepth <= MAX_REDIRECT_DEPTH,
        attemptId: current?.id,
        request: { ...next, redirectDepth } satisfies NavigationRequest,
      };
    },
  });

  const acceptedCandidate = sample({
    clock: classifiedCandidate,
    filter: ({ accepted }) => accepted,
    fn: ({ request }) => request,
  });

  sample({
    clock: acceptedCandidate,
    target: coordinator.request,
  });

  const reportRedirectLoopFx = createEffect(() => {
    console.error(
      `[@effector/router] Redirect cancelled after ${MAX_REDIRECT_DEPTH} consecutive redirects`,
    );
  });

  const redirectLoop = sample({
    clock: classifiedCandidate,
    filter: ({ accepted, attemptId }) => !accepted && attemptId !== undefined,
    fn: ({ attemptId }) => attemptId as number,
  });

  sample({
    clock: redirectLoop,
    target: coordinator.cancel,
  });

  sample({
    clock: redirectLoop,
    target: reportRedirectLoopFx,
  });

  const subscribeHistoryFx = createAsyncAction({
    target: {
      locationUpdated,
      locationInitialized,
      initialized,
      nativeNavigationRequested,
      $subscription,
      $blockSubscription,
    },
    source: { $subscription, $blockSubscription },
    fn: async (target, getSource, history: RouterAdapter | null) => {
      if (!history) {
        throw Error(
          'Cannot initialize router controls with empty history adapter. Please provide a non-null adapter',
        );
      }

      const source = await getSource();
      source.subscription?.unsubscribe();
      source.blockSubscription?.unsubscribe();

      target.locationInitialized({
        pathname: history.location.pathname,
        query: parseQuery(history.location.search),
      });

      target.$subscription(
        history.listen((location) => {
          target.locationUpdated({
            pathname: location.pathname,
            query: parseQuery(location.search),
          });
        }),
      );

      target.$blockSubscription(
        history.block?.((transition) => {
          target.nativeNavigationRequested(transition);
        }) ?? null,
      );

      target.initialized({
        path: history.location.pathname,
        query: parseQuery(history.location.search),
      });
    },
  });

  const goBackFx = attach({
    source: $history,
    effect: (history) => {
      if (!history) throw new Error('history not found');
      history.goBack();
    },
  });

  const goForwardFx = attach({
    source: $history,
    effect: (history) => {
      if (!history) throw new Error('history not found');
      history.goForward();
    },
  });

  sample({ clock: setHistory, target: $history });
  sample({ clock: $history, filter: Boolean, target: subscribeHistoryFx });
  sample({
    clock: locationInitialized,
    fn: (location) => ({ path: location.pathname, query: location.query }),
    target: $locationState,
  });
  const locationChanged = sample({
    clock: locationUpdated,
    source: $locationState,
    filter: (current, next) =>
      !isEqualLocation(current, {
        path: next.pathname,
        query: next.query,
      }),
    fn: (_, next) => ({ path: next.pathname, query: next.query }),
  });
  sample({
    clock: locationChanged,
    target: updated,
  });
  sample({ clock: locationChanged, target: $locationState });
  const initializedBack = sample({
    clock: back,
    source: $history,
    filter: Boolean,
  });
  const initializedForward = sample({
    clock: forward,
    source: $history,
    filter: Boolean,
  });

  sample({ clock: initializedBack, target: goBackFx });
  sample({ clock: initializedForward, target: goForwardFx });
  sample({
    clock: back,
    source: $history,
    filter: (history): history is null => history === null,
    fn: (): NavigationFailure => ({
      operation: 'back',
      reason: 'not-initialized',
    }),
    target: navigationFailed,
  });
  sample({
    clock: forward,
    source: $history,
    filter: (history): history is null => history === null,
    fn: (): NavigationFailure => ({
      operation: 'forward',
      reason: 'not-initialized',
    }),
    target: navigationFailed,
  });

  const routeParsers = new WeakMap<
    Route<any>,
    Array<(path: string) => unknown>
  >();

  const controls: InternalRouterControls = {
    $history,
    $locationState,
    $query,
    $path,
    setHistory,
    navigate,
    back,
    forward,
    navigationFailed,
    locationInitialized,
    initialized,
    updated,
    locationUpdated,
    internal: {
      navigationStarted: coordinator.started,
      hold,
      proceed,
      cancel,
      registerRoute: (route, parse) => {
        const parsers = routeParsers.get(route) ?? [];
        routeParsers.set(route, [...parsers, parse]);
      },
      routeMatches: (route, path) =>
        routeParsers.get(route)?.some((parse) => parse(path)),
    },
  };

  return controls;
}
