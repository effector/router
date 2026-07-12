import {
  attach,
  combine,
  createEffect,
  createEvent,
  createStore,
  sample,
  type Effect,
} from 'effector';
import type {
  AsyncBundleImport,
  InternalRoute,
  PathlessRoute,
  PathRoute,
  Route,
  RouteOpenedPayload,
} from './types';

import { ParseUrlParams, ValidatePath } from '@effector/router-paths';
import { createAction } from 'effector-action';

type WithBaseRouteConfig<T = void> = T & {
  parent?: Route<any>;
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
  let asyncImport: AsyncBundleImport;

  const beforeOpen = config.beforeOpen ?? [];

  type OpenPayload = RouteOpenedPayload<Params>;

  const waitForAsyncBundleFx = createEffect(() => asyncImport?.());

  const beforeOpenFx = createEffect(async () => {
    for (const fx of beforeOpen) {
      await fx();
    }
  });

  // Serializes the params/query of an `open` call so the location update it
  // triggers can be recognized as this route's own echo.
  const keyOf = (payload: OpenPayload) =>
    JSON.stringify({
      params: (payload as { params?: unknown } | undefined)?.params ?? {},
      query: (payload as { query?: unknown } | undefined)?.query ?? {},
    });

  // Holds the key of an in-flight imperative `open`, so the navigation echo it
  // produces opens the route without running `beforeOpen` a second time.
  const $selfOpenKey = createStore<string | null>(null);

  const openFx = createEffect<OpenPayload, OpenPayload>(async (payload) => {
    await waitForAsyncBundleFx();
    await beforeOpenFx();

    const parent = config.parent as InternalRoute | undefined;

    if (parent) {
      await parent.internal.openFx({
        ...(payload ?? { params: {} }),
        navigate: false,
      });
    }

    return payload;
  });

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

  const navigatedFx = attach({
    source: $selfOpenKey,
    effect: async (selfKey, payload: OpenPayload) => {
      await waitForAsyncBundleFx();

      const isSelfEcho = selfKey !== null && selfKey === keyOf(payload);

      // External navigation runs the guards here; the echo of this route's own
      // `open` already ran them, so it just settles the route open.
      if (!isSelfEcho) {
        await beforeOpenFx();

        const parent = config.parent as InternalRoute | undefined;

        if (parent) {
          await parent.internal.openFx({
            ...(payload ?? { params: {} }),
            navigate: false,
          });
        }
      }

      return payload;
    },
  });

  const $params = createStore<Params>({} as Params);

  const $isOpened = createStore(false);
  const $isPending = combine(
    openFx.pending,
    navigatedFx.pending,
    (openPending, navigatedPending) => openPending || navigatedPending,
  );

  const open = createEvent<OpenPayload>();
  const close = createEvent();

  const opened = createEvent<OpenPayload>();
  const openedOnServer = createEvent<OpenPayload>();
  const openedOnClient = createEvent<OpenPayload>();

  const navigated = createEvent<OpenPayload>();

  const closed = createEvent();

  const defaultParams = {} as Params;

  // Mark the route's own imperative open so its navigation echo is recognized,
  // and clear the mark once that echo settles (or the open is rejected).
  $selfOpenKey.on(open, (_, payload) => keyOf(payload));
  $selfOpenKey.reset(navigatedFx.finally, openFx.fail);

  sample({
    clock: open,
    target: openFx,
  });

  sample({
    clock: navigated,
    fn: (payload) => ({ navigate: false, ...payload }),
    target: navigatedFx,
  });

  sample({
    clock: navigatedFx.done,
    fn: ({ params }) => params,
    target: forceOpenParentFx,
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
    clock: navigatedFx.failData,
    fn: () => defaultParams,
    target: $params,
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
      const { navigate: _, ...openedPayload } = (payload ?? {}) as Record<
        string,
        unknown
      >;
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

      setAsyncImport: (value: AsyncBundleImport) => (asyncImport = value),
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
