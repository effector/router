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

type ParentRoute = Route<any> | undefined;

type ParentRouteParams<Parent extends ParentRoute> =
  Parent extends Route<infer Params> ? Params : void;

type MergeRouteParams<
  ParentParams extends object | void,
  Params extends object | void,
> = ParentParams extends void
  ? Params
  : Params extends void
    ? ParentParams
    : ParentParams & Params;

type WithBaseRouteConfig<
  T = object,
  Parent extends ParentRoute = undefined,
> = T & {
  parent?: Parent;
  /** @deprecated Use `chainRoute` for post-commit preparation. */
  beforeOpen?: Effect<void, any, any>[];
};

function isSameParamValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (!Array.isArray(left) || !Array.isArray(right)) {
    return false;
  }

  return (
    left.length === right.length &&
    left.every((value, index) => Object.is(value, right[index]))
  );
}

function isSameParams(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }

  if (
    !left ||
    !right ||
    typeof left !== 'object' ||
    typeof right !== 'object'
  ) {
    return false;
  }

  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);

  return (
    leftEntries.length === rightEntries.length &&
    leftEntries.every(
      ([key, value]) =>
        key in right &&
        isSameParamValue(value, (right as Record<string, unknown>)[key]),
    )
  );
}

function getPayloadParams<Params>(
  payload: unknown,
  defaultParams: Params,
): Params {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('params' in payload) ||
    !payload.params
  ) {
    return defaultParams;
  }

  return { ...payload.params } as Params;
}

export type CreateRouteConfig<Path, Parent extends ParentRoute = undefined> =
  ValidatePath<Path> extends ['invalid', infer Template]
    ? WithBaseRouteConfig<
        {
          path: Template;
        },
        Parent
      >
    : WithBaseRouteConfig<
        {
          path: Path;
          beforeOpen?: Effect<void, any, any>[];
        },
        Parent
      >;
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
export function createRoute<T extends string, Parent extends Route<any>>(
  config: WithBaseRouteConfig<{ path: T }, Parent> & { parent: Parent },
): PathRoute<MergeRouteParams<ParentRouteParams<Parent>, ParseUrlParams<T>>>;
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

  const $params = createStore<Params>({} as Params, {
    updateFilter: (next, current) => !isSameParams(next, current),
  });

  const $isOpened = createStore(false);
  const $isPending = lifecycle.$current.map(Boolean);

  const open = createEvent<OpenPayload>();
  const close = createEvent();

  const opened = createEvent<OpenPayload>();
  const openedOnServer = createEvent<OpenPayload>();
  const openedOnClient = createEvent<OpenPayload>();

  const navigated = createEvent<OpenPayload>();
  const updated = createEvent<Params>();

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
    fn: (target, payload) =>
      target.$params(getPayloadParams(payload, defaultParams)),
  });

  sample({
    clock: $params.updates,
    target: updated,
  });

  const preparationFailed = sample({
    clock: prepareFx.fail,
    source: lifecycle.$current,
    filter: (current, { params }) => current?.id === params.id,
    fn: (_, { params }) => params.id,
  });

  sample({
    clock: preparationFailed,
    target: lifecycle.cancel,
  });

  sample({
    clock: preparationFailed,
    fn: () => defaultParams,
    target: $params,
  });

  sample({
    clock: preparationFailed,
    source: $isOpened,
    filter: Boolean,
    fn: () => undefined,
    target: closed,
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
    updated,

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
