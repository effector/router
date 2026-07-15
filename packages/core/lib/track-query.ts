import {
  combine,
  createEffect,
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
  Route,
  RouterControls,
  TrackQueryConfig,
} from './types';

import type { z, ZodType } from 'zod/v4';

type FactoryPayload = {
  $active: Store<boolean>;
  $query: Store<Query>;
  navigate: EventCallable<NavigatePayload>;
};

export function trackQueryFactory({
  $active,
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

    const changes = merge([$query.updates, $active.updates]);
    const $revision = createStore(0).on(changes, (revision) => revision + 1);
    const evaluateFx = createEffect(
      async (payload: { active: boolean; query: Query; revision: number }) => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        return payload;
      },
    );

    sample({
      clock: $revision.updates,
      source: { active: $active, query: $query, revision: $revision },
      target: evaluateFx,
    });

    const evaluation = sample({
      clock: evaluateFx.doneData,
      source: $revision,
      filter: (revision, payload) => revision === payload.revision,
      fn: (_, payload) => payload,
    });

    sample({
      clock: evaluation,
      filter: ({ active, query }) =>
        active && parameters.safeParse(query).success,
      fn: ({ query }) => parameters.safeParse(query).data,
      target: [entered, changeEntered.prepend(() => true)],
    });

    sample({
      clock: evaluation,
      source: $entered,
      filter: (entered, { active, query }) =>
        entered && !(active && parameters.safeParse(query).success),
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
  const $active = config.routes
    ? combine(
        config.routes.map((route) => route.$isOpened),
        (opened) => opened.some(Boolean),
      )
    : createStore(true);

  return trackQueryFactory({
    $active,
    $query: config.controls.$query,
    navigate: config.controls.navigate,
  })(config);
}
