import {
  combine,
  createEvent,
  createStore,
  EventCallable,
  merge,
  sample,
  type Store,
} from 'effector';

import type {
  NavigatePayload,
  Query,
  QueryTracker,
  QueryTrackerConfig,
  QueryParametersInput,
  TrackQueryConfig,
} from './types';
import type { InternalRouterControls } from './navigation';

import type { z, ZodType } from 'zod/v4';

type FactoryPayload = {
  $ready: Store<boolean>;
  $eligible: Store<boolean>;
  $query: Store<Query>;
  navigate: EventCallable<NavigatePayload>;
};

export function trackQueryFactory({
  $ready,
  $eligible,
  $query,
  navigate,
}: FactoryPayload) {
  return <T extends ZodType>(
    config: QueryTrackerConfig<T>,
  ): QueryTracker<T> => {
    const { parameters } = config;
    const schemaKeys = Object.keys(
      ((parameters as unknown as { shape?: Record<string, unknown> }).shape ??
        {}) as Record<string, unknown>,
    );

    const $entered = createStore(false);

    const entered = createEvent<z.output<T>>();
    const exited = createEvent();

    const enter = createEvent<QueryParametersInput<T>>();
    const exit = createEvent<{ ignoreParams: string[] } | void>();

    const changeEntered = createEvent<boolean>();

    sample({
      clock: changeEntered,
      target: $entered,
    });

    const evaluation = sample({
      clock: combine({
        ready: $ready,
        eligible: $eligible,
        query: $query,
      }).updates,
      fn: ({ ready, eligible, query }) => ({
        ready,
        eligible,
        result: eligible ? parameters.safeParse(query) : null,
      }),
    });

    sample({
      clock: evaluation,
      filter: ({ ready, result }) => ready && result?.success === true,
      fn: ({ result }) => result!.data,
      target: [entered, changeEntered.prepend(() => true)],
    });

    sample({
      clock: evaluation,
      source: $entered,
      filter: (entered, { eligible, result }) =>
        entered && (!eligible || result?.success !== true),
      target: [
        exited.prepend(() => undefined),
        changeEntered.prepend(() => false),
      ],
    });

    sample({
      clock: enter,
      source: $query,
      fn: (query, payload) => {
        return { query: { ...query, ...payload } };
      },
      target: navigate,
    });

    sample({
      clock: exit,
      source: $query,
      fn: (query, payload) => {
        const ignored = new Set(payload?.ignoreParams ?? []);
        const owned = new Set(schemaKeys);
        const copy: Query = {};

        for (const [key, value] of Object.entries(query)) {
          if (!owned.has(key) || ignored.has(key)) {
            copy[key] = value;
          }
        }

        return { query: copy };
      },
      target: navigate,
    });

    return {
      enter,
      entered,

      exited,
      exit,
    };
  };
}

export function trackQuery<T extends ZodType>(
  config: TrackQueryConfig<T>,
): QueryTracker<T> {
  let $ready: Store<boolean>;
  let $eligible: Store<boolean>;

  if (config.routes?.length) {
    const routes = config.routes;
    const controls = config.controls as InternalRouterControls;

    // A location commits before its matching route finishes activation. Match
    // registered routes to that location so an old open route cannot validate
    // the new query while the selected target is still preparing.
    const $activity = combine(
      {
        path: controls.$path,
        opened: combine(routes.map((route) => route.$isOpened)),
        pending: combine(routes.map((route) => route.$isPending)),
      },
      ({ path, opened, pending }) => {
        let ready = false;
        let waiting = false;
        let registeredTarget = false;

        for (let index = 0; index < routes.length; index += 1) {
          const route = routes[index];
          const pathMatch =
            path === null
              ? undefined
              : controls.internal.routeMatches(route, path);
          const registered = pathMatch !== undefined;
          const matches = registered ? pathMatch : true;

          if (registered && matches) registeredTarget = true;
          if (matches && opened[index]) ready = true;
          if (matches && pending[index]) waiting = true;
        }

        return { ready, waiting, registeredTarget };
      },
    );

    $ready = $activity.map(({ ready }) => ready);

    const pendingChanges = merge(
      routes.map((route) => route.$isPending.updates),
    );
    const pendingStarted = sample({
      clock: pendingChanges,
      source: $activity,
      filter: ({ waiting }) => waiting,
    });
    const $pendingObserved = createStore(false, { serialize: 'ignore' });
    const pendingFinished = sample({
      clock: pendingChanges,
      source: { activity: $activity, observed: $pendingObserved },
      filter: ({ activity, observed }) => observed && !activity.waiting,
    });

    $pendingObserved.on(pendingStarted, () => true).reset(pendingFinished);

    const readyStarted = sample({
      clock: $ready.updates,
      filter: Boolean,
    });
    const routeClosed = merge(
      routes.map((route) => route.closed.map(() => route)),
    );
    const relevantRouteClosed = sample({
      clock: routeClosed,
      source: { activity: $activity, path: controls.$path },
      filter: ({ activity, path }, route) => {
        if (activity.ready) return false;
        if (path === null) return true;
        return controls.internal.routeMatches(route, path) ?? true;
      },
    });

    // A matching path is eligible while its activation is pending, but stops
    // being eligible after that attempt fails or the active route is closed.
    const $targetInactive = createStore(false, { serialize: 'ignore' })
      .on([pendingFinished, relevantRouteClosed], () => true)
      .reset([controls.$path.updates, pendingStarted, readyStarted]);

    $eligible = combine(
      $activity,
      $targetInactive,
      ({ ready, waiting, registeredTarget }, targetInactive) =>
        ready || waiting || (registeredTarget && !targetInactive),
    );
  } else if (config.routes) {
    $ready = createStore(false);
    $eligible = $ready;
  } else {
    $ready = createStore(true);
    $eligible = $ready;
  }

  return trackQueryFactory({
    $ready,
    $eligible,
    $query: config.controls.$query,
    navigate: config.controls.navigate,
  })(config);
}
