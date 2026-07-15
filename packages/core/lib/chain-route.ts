import {
  createEffect,
  createEvent,
  createStore,
  sample,
  type EventCallable,
  type Unit,
} from 'effector';
import type { LegacyVirtualRoute, Route, RouteOpenedPayload } from './types';
import { createVirtualRoute } from './create-virtual-route';
import { createAttemptCoordinator } from './transition-attempt';

type BeforeOpenUnit<T extends object | void = void> =
  | ((payload: RouteOpenedPayload<T>) => unknown)
  | ((payload: void) => unknown);

export interface ChainRouteProps<T extends object | void = void> {
  route: Route<T> | LegacyVirtualRoute<RouteOpenedPayload<T>, T>;
  beforeOpen: BeforeOpenUnit<T> | BeforeOpenUnit<T>[];
  openOn?: Unit<any> | Unit<any>[];
  cancelOn?: Unit<any> | Unit<any>[];
}

interface ChainState<T extends object | void> {
  attemptId: number;
  payload: RouteOpenedPayload<T>;
  prepared: boolean;
  openRequested: boolean;
}

function asUnits(unit?: Unit<any> | Unit<any>[]): Unit<any>[] {
  if (!unit) return [];
  return Array.isArray(unit) ? unit : [unit];
}

/**
 * Derives a post-commit readiness route from an already activated route.
 * It does not mutate history and therefore is intentionally separate from
 * `beforeNavigate`.
 */
export function chainRoute<T extends object | void = void>(
  props: ChainRouteProps<T>,
): LegacyVirtualRoute<RouteOpenedPayload<T>, T> {
  const { route, beforeOpen } = props;
  const openOn = asUnits(props.openOn);
  const cancelOn = asUnits(props.cancelOn);
  const beforeOpenUnits = Array.isArray(beforeOpen) ? beforeOpen : [beforeOpen];

  const coordinator = createAttemptCoordinator<RouteOpenedPayload<T>>({
    concurrency: 'takeLatest',
  });

  const $isPending = coordinator.$current.map(Boolean);

  const transformer = (payload: RouteOpenedPayload<T>): T => {
    if (!payload) return {} as T;
    return 'params' in payload ? (payload.params as T) : ({} as T);
  };

  const chained = createVirtualRoute<RouteOpenedPayload<T>, T>({
    $isPending,
    transformer,
  });

  const openRequested = createEvent<number>();

  const $state = createStore<ChainState<T> | null>(null, {
    serialize: 'ignore',
  })
    .on(coordinator.started, (_, attempt) => ({
      attemptId: attempt.id,
      payload: attempt.payload,
      prepared: false,
      openRequested: false,
    }))
    .on(openRequested, (state, attemptId) => {
      if (!state || state.attemptId !== attemptId) return state;
      return { ...state, openRequested: true };
    })
    .reset([coordinator.completed, coordinator.cancelled]);

  const runBeforeOpenFx = createEffect(
    async (attempt: { id: number; payload: RouteOpenedPayload<T> }) => {
      for (const unit of beforeOpenUnits) {
        // Calling a unit from an effect keeps the active Effector scope and lets
        // effects be awaited while events remain synchronous.
        await (unit as (payload: RouteOpenedPayload<T>) => unknown)(
          attempt.payload,
        );
      }

      return attempt;
    },
  );

  sample({ clock: route.opened, target: coordinator.requested });
  sample({ clock: coordinator.started, target: runBeforeOpenFx });

  sample({
    clock: coordinator.started,
    source: chained.$isOpened,
    filter: Boolean,
    fn: () => undefined,
    target: chained.close,
  });

  const preparationFinished = sample({
    clock: runBeforeOpenFx.doneData,
    source: coordinator.$current,
    filter: (current, result) => current?.id === result.id,
    fn: (_, result) => result,
  });

  $state.on(preparationFinished, (state, attempt) => {
    if (!state || state.attemptId !== attempt.id) return state;
    return { ...state, prepared: true };
  });

  if (openOn.length > 0) {
    sample({
      clock: openOn,
      source: coordinator.$current,
      filter: Boolean,
      fn: (attempt) => attempt.id,
      target: openRequested,
    });
  }

  const openAttempt = createEvent<{
    id: number;
    payload: RouteOpenedPayload<T>;
  }>();

  sample({
    clock: preparationFinished,
    source: $state,
    filter: (state, attempt) =>
      state?.attemptId === attempt.id &&
      (openOn.length === 0 || state.openRequested),
    fn: (_, attempt) => attempt,
    target: openAttempt,
  });

  sample({
    clock: openRequested,
    source: $state,
    filter: (state, attemptId) =>
      state?.attemptId === attemptId && state.prepared,
    fn: (state) => ({ id: state!.attemptId, payload: state!.payload }),
    target: openAttempt,
  });

  sample({
    clock: openAttempt,
    fn: ({ payload }) => payload,
    target: chained.open,
  });

  sample({
    clock: openAttempt,
    fn: ({ id }) => id,
    target: coordinator.complete,
  });

  sample({
    clock: runBeforeOpenFx.fail,
    source: coordinator.$current,
    filter: (current, { params }) => current?.id === params.id,
    fn: (_, { params }) => params.id,
    target: coordinator.cancel,
  });

  const cancellationRequested = createEvent();

  if (cancelOn.length > 0) {
    sample({
      clock: cancelOn,
      fn: () => undefined,
      target: cancellationRequested,
    });
  }

  const cancellationAttempt = sample({
    clock: cancellationRequested,
    source: coordinator.$current,
    fn: (attempt) => attempt,
  });

  sample({
    clock: cancellationAttempt,
    filter: Boolean,
    fn: (attempt) => attempt.id,
    target: coordinator.cancel,
  });

  const cancelOpened = sample({
    clock: cancellationAttempt,
    filter: (attempt) => attempt === null,
    fn: () => undefined,
  });

  const cancelledEvent = chained.cancelled as EventCallable<void>;

  sample({ clock: cancelOpened, target: [chained.close, cancelledEvent] });

  const parentClosed = sample({
    clock: route.closed,
    source: coordinator.$current,
    fn: (attempt) => attempt,
  });

  sample({
    clock: parentClosed,
    filter: Boolean,
    fn: (attempt) => attempt.id,
    target: coordinator.cancel,
  });

  sample({
    clock: parentClosed,
    filter: (attempt) => attempt === null,
    fn: () => undefined,
    target: chained.close,
  });

  sample({
    clock: coordinator.cancelled,
    fn: () => undefined,
    target: [chained.close, cancelledEvent],
  });

  return chained;
}
