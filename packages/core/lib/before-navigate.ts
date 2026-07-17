import {
  createEvent,
  createStore,
  is as isEffector,
  sample,
  type Event,
  type EventCallable,
  type Store,
} from 'effector';

import type { NavigatePayload, PathRoute, RouterControls } from './types';
import type { InternalRouterControls } from './navigation';

type RouteSelection = PathRoute<any> | readonly PathRoute<any>[];

export interface BeforeNavigateConfig {
  controls: RouterControls;
  from?: RouteSelection;
  to?: RouteSelection;
  /** `true` means that a matching transition must be held. */
  filter?: Store<boolean> | ((navigation: NavigatePayload) => boolean);
}

export interface BeforeNavigateResult {
  started: Event<void>;
  proceed: EventCallable<void>;
  cancel: EventCallable<void>;
}

let lastOwnerId = 0;

function asArray(selection?: RouteSelection): readonly PathRoute<any>[] {
  if (!selection) return [];
  return Array.isArray(selection)
    ? (selection as readonly PathRoute<any>[])
    : [selection as PathRoute<any>];
}

/** Holds matching navigation until the model explicitly proceeds or cancels. */
export function beforeNavigate(
  config: BeforeNavigateConfig,
): BeforeNavigateResult {
  const controls = config.controls as InternalRouterControls;
  const ownerId = ++lastOwnerId;
  const from = asArray(config.from);
  const to = asArray(config.to);
  const predicate =
    typeof config.filter === 'function' ? config.filter : () => true;
  const $enabled = isEffector.store(config.filter)
    ? config.filter
    : createStore(true);

  const started = createEvent();
  const proceed = createEvent();
  const cancel = createEvent();

  const matched = sample({
    clock: controls.internal.navigationStarted,
    source: $enabled,
    filter: (enabled, attempt) => {
      if (!enabled || !predicate(attempt.payload.navigation)) return false;

      const matches = (routes: readonly PathRoute<any>[], path: string) =>
        routes.length === 0 ||
        routes.some((route) => controls.internal.routeMatches(route, path));

      return (
        matches(from, attempt.payload.from) &&
        matches(to, attempt.payload.navigation.path)
      );
    },
    fn: (_, attempt) => ({ attemptId: attempt.id, ownerId }),
  });

  sample({ clock: matched, target: controls.internal.hold });

  sample({
    clock: controls.internal.hold,
    filter: (hold) => hold.ownerId === ownerId,
    fn: () => undefined,
    target: started,
  });

  sample({
    clock: proceed,
    fn: () => ownerId,
    target: controls.internal.proceed,
  });

  sample({
    clock: cancel,
    fn: () => ownerId,
    target: controls.internal.cancel,
  });

  return { started, proceed, cancel };
}
