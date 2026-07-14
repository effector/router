import {
  createEffect,
  createEvent,
  createStore,
  sample,
  type Effect,
} from 'effector';
import type {
  InternalRoute,
  PathlessRoute,
  PathRoute,
  Route,
  RouteOpenedPayload,
} from './types';

import { ParseUrlParams, ValidatePath } from '@effector/router-paths';
import { createAction } from 'effector-action';
import { createAttemptCoordinator } from './transition-attempt';

type WithBaseRouteConfig<T = void> = T & {
  parent?: Route<any>;
  /** @deprecated Use `chainRoute` for post-commit preparation. */
  beforeOpen?: Effect<void, any, any>[];
};

export type CreateRouteConfig<Path> =
  ValidatePath<Path> extends ['invalid', infer Template]
    ? WithBaseRouteConfig<{
        path: Template;
      }>
    : WithBaseRouteConfig<{
        path: Path;
        parent?: Route<any>;
        beforeOpen?: Effect<void, any, any>[];
      }>;
/**
 * @description Creates route
 * @param config Route config
 * @returns `Route\<Params\>`
 * @link https://router.effector.dev/core/create-route.html
 * @example ```ts
 * import { createRoute } from '@effector/router';
 *
 * // basic
 * const route = createRoute({ path: '/route' });
 * route.open();
 *
 * // with params
 * const postRoute = createRoute({ path: '/post/:id' });
 * //       ^---  Route<{ id: string }>
 *
 * // with parent
 * const profile = createRoute({ path: '/profile/:id' });
 *
 * const friends = createRoute({ path: '/friends', parent: profile });
 * const posts = createRoute({ path: '/posts', parent: profile });
 *
 * posts.open(); // profile.$isOpened -> true, posts.$isOpened -> true
 * ```
 */
export function createRoute<
  T extends string,
  Params extends object | void = ParseUrlParams<T>,
>(config: CreateRouteConfig<T>): PathRoute<Params>;
export function createRoute<Params extends object | void = void>(
  config?: WithBaseRouteConfig,
): PathlessRoute<Params>;
export function createRoute<Params>(
  config:
    | WithBaseRouteConfig
    | CreateRouteConfig<any> = {} as WithBaseRouteConfig,
): PathRoute<any> | PathlessRoute<any> {
  const beforeOpen = config.beforeOpen ?? [];

  // Opening a path route is a navigation intent. Preparation starts only
  // after the adapter confirms the resulting location.
  const openFx = createEffect<OpenPayload, OpenPayload>((payload) => payload);

  const forceOpenParentFx = createEffect<OpenPayload, OpenPayload>(
    async (payload) => {
      const parent = config.parent as InternalRoute | undefined;

      if (parent) {
        await parent.internal.forceOpenParentFx({
          ...(payload ?? { params: {} }),
          navigate: false,
        });
      }

      return payload;
    },
  );

  type OpenPayload = RouteOpenedPayload<Params>;

  const lifecycle = createAttemptCoordinator<OpenPayload>({
    concurrency: 'takeLatest',
  });

  const $params = createStore<Params>({} as Params);

  const $isOpened = createStore(false);
  const $isPending = lifecycle.$current.map(Boolean);

  const open = createEvent<OpenPayload>();
  const close = createEvent();

  const opened = createEvent<OpenPayload>();
  const openedOnServer = createEvent<OpenPayload>();
  const openedOnClient = createEvent<OpenPayload>();

  const navigated = createEvent<OpenPayload>();

  const closed = createEvent();

  const beforeOpenFx = createEffect(async () => {
    for (const fx of beforeOpen) {
      await fx();
    }
  });

  const prepareFx = createEffect(
    async (attempt: { id: number; payload: OpenPayload }) => {
      await beforeOpenFx();

      return attempt;
    },
  );

  const activateFx = createEffect(
    async (attempt: { id: number; payload: OpenPayload }) => {
      await forceOpenParentFx({ navigate: false, ...attempt.payload });

      return attempt;
    },
  );

  const defaultParams = {} as Params;

  sample({
    clock: open,
    target: openFx,
  });

  sample({
    clock: navigated,
    target: lifecycle.requested,
  });

  sample({
    clock: lifecycle.started,
    target: prepareFx,
  });

  const prepared = sample({
    clock: prepareFx.doneData,
    source: lifecycle.$current,
    filter: (current, result) => current?.id === result.id,
    fn: (_, result) => result,
  });

  sample({
    clock: prepared,
    target: activateFx,
  });

  createAction({
    clock: forceOpenParentFx.doneData,
    target: { $params },
    fn: (target, payload) => {
      if (!payload) {
        return target.$params(defaultParams);
      }

      return target.$params(
        'params' in payload ? { ...payload.params } : defaultParams,
      );
    },
  });

  sample({
    clock: prepareFx.failData,
    fn: () => defaultParams,
    target: $params,
  });

  sample({
    clock: prepareFx.fail,
    source: lifecycle.$current,
    filter: (current, { params }) => current?.id === params.id,
    fn: (_, { params }) => params.id,
    target: lifecycle.cancel,
  });

  createAction({
    clock: forceOpenParentFx.doneData,
    target: {
      openedOnServer,
      openedOnClient,
    },
    fn: (target, payload) => {
      // Strip internal navigate flag before exposing through the public opened event,
      // so samplings like `sample({ clock: route.opened, target: otherRoute.open })`
      // don't accidentally suppress navigation in the target route.
      const openedPayload = { ...((payload ?? {}) as Record<string, unknown>) };
      delete openedPayload.navigate;
      const eventPayload = openedPayload as OpenPayload;

      if (typeof window === 'undefined') {
        return target.openedOnServer(eventPayload);
      }

      return target.openedOnClient(eventPayload);
    },
  });

  // @ts-expect-error TS is very stupid
  sample({
    clock: [openedOnClient, openedOnServer],
    target: opened,
  });

  sample({
    clock: close,
    target: closed,
  });

  sample({
    clock: close,
    source: lifecycle.$current,
    filter: Boolean,
    fn: (attempt) => attempt.id,
    target: lifecycle.cancel,
  });

  sample({
    clock: activateFx.doneData,
    source: lifecycle.$current,
    filter: (current, result) => current?.id === result.id,
    fn: (_, result) => result.id,
    target: lifecycle.complete,
  });

  sample({
    clock: [opened.map(() => true), closed.map(() => false)],
    target: $isOpened,
  });

  return {
    $params,
    $isOpened,
    $isPending,

    // @ts-expect-error :((
    open,
    closed,
    opened,
    openedOnClient,
    openedOnServer,

    ...config,

    internal: {
      navigated,
      close,
      openFx,
      forceOpenParentFx,
    },

    '@@unitShape': () => ({
      params: $params,
      isPending: $isPending,
      isOpened: $isOpened,

      // @ts-expect-error :((
      onOpen: open,
    }),
  };
}
