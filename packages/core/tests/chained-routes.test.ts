import { describe, expect, test, vi } from 'vitest';
import {
  chainRoute,
  createRoute,
  RouteOpenedPayload,
  createRouter,
  historyAdapter,
  createVirtualRoute,
} from '../lib';
import {
  allSettled,
  createEffect,
  createEvent,
  fork,
  sample,
  scopeBind,
} from 'effector';
import { createMemoryHistory } from 'history';
import { watchCalls } from './utils';

describe('chained routes', () => {
  test('authorized route', async () => {
    const scope = fork();

    const route = createRoute({ path: '/profile/:id' });
    const router = createRouter({ routes: [route] });

    await allSettled(router.setHistory, {
      params: historyAdapter(createMemoryHistory()),
      scope,
    });

    const authorized = createEvent();
    const rejected = createEvent();

    const checkAuthorizationFx = createEffect<
      RouteOpenedPayload<{ id: string }>,
      boolean
    >(({ params }) => params.id !== '0');

    sample({
      clock: checkAuthorizationFx.doneData,
      filter: (isAuthorized) => isAuthorized,
      target: authorized,
    });

    sample({
      clock: checkAuthorizationFx.doneData,
      filter: (isAuthorized) => !isAuthorized,
      target: rejected,
    });

    const virtual = chainRoute({
      route,
      beforeOpen: checkAuthorizationFx,
      openOn: authorized,
      cancelOn: rejected,
    });

    await allSettled(route.open, {
      scope,
      params: { params: { id: '0' } },
    });

    expect(scope.getState(virtual.$isOpened)).toBeFalsy();

    await allSettled(route.open, {
      scope,
      params: { params: { id: '1' } },
    });

    expect(scope.getState(virtual.$isOpened)).toBeTruthy();
    expect(scope.getState(virtual.$params)).toStrictEqual({ id: '1' });
  });

  test('virtual route groupping', async () => {
    const scope = fork();
    const virtualRoute = createVirtualRoute<RouteOpenedPayload<void>>();

    const fx = createEffect((params: RouteOpenedPayload<void>) => params);

    const counter = watchCalls(fx, scope);

    const chainedRoute = chainRoute({
      route: virtualRoute,
      beforeOpen: [fx],
      openOn: fx.doneData,
    });

    expect(counter).not.toBeCalled();

    await allSettled(virtualRoute.open, {
      scope,
      params: { query: { test: 'abc' } },
    });

    expect(counter).toBeCalled();
    expect(counter.mock.calls[0]).toStrictEqual([
      {
        query: {
          test: 'abc',
        },
      },
    ]);
    expect(scope.getState(chainedRoute.$isOpened)).toBeTrueWithMessage(
      'Chained route is must be opened',
    );
  });

  test('opens automatically and exposes pending without openOn', async () => {
    let resolve!: () => void;
    const parent = createVirtualRoute<
      RouteOpenedPayload<{ id: string }>,
      { id: string }
    >({ transformer: (payload) => payload.params });
    const prepareFx = createEffect(
      () => new Promise<void>((done) => (resolve = done)),
    );
    const chained = chainRoute({ route: parent, beforeOpen: prepareFx });
    const scope = fork();

    const opening = allSettled(parent.open, {
      scope,
      params: { params: { id: '42' } },
    });

    await vi.waitFor(() =>
      expect(scope.getState(chained.$isPending)).toBe(true),
    );
    expect(scope.getState(chained.$isOpened)).toBe(false);

    resolve();
    await opening;

    expect(scope.getState(chained.$isPending)).toBe(false);
    expect(scope.getState(chained.$isOpened)).toBe(true);
    expect(scope.getState(chained.$params)).toEqual({ id: '42' });
  });

  test('stays pending while waiting for openOn', async () => {
    const parent = createVirtualRoute<RouteOpenedPayload<void>>();
    const started = createEvent<RouteOpenedPayload<void>>();
    const ready = createEvent();
    const chained = chainRoute({
      route: parent,
      beforeOpen: started,
      openOn: ready,
    });
    const scope = fork();

    await allSettled(parent.open, { scope, params: {} });

    expect(scope.getState(chained.$isPending)).toBe(true);
    expect(scope.getState(chained.$isOpened)).toBe(false);

    await allSettled(ready, { scope });

    expect(scope.getState(chained.$isPending)).toBe(false);
    expect(scope.getState(chained.$isOpened)).toBe(true);
  });

  test('effect failure cancels the current chain attempt', async () => {
    const parent = createVirtualRoute<RouteOpenedPayload<void>>();
    const failedFx = createEffect(() => {
      throw new Error('preparation failed');
    });
    const chained = chainRoute({ route: parent, beforeOpen: failedFx });
    const scope = fork();
    const cancelled = watchCalls(chained.cancelled, scope);

    await allSettled(parent.open, { scope, params: {} });

    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(scope.getState(chained.$isPending)).toBe(false);
    expect(scope.getState(chained.$isOpened)).toBe(false);
  });

  test('parent close cancels pending preparation', async () => {
    let resolve!: () => void;
    const parent = createVirtualRoute<RouteOpenedPayload<void>>();
    const prepareFx = createEffect(
      () => new Promise<void>((done) => (resolve = done)),
    );
    const chained = chainRoute({ route: parent, beforeOpen: prepareFx });
    const scope = fork();
    const cancelled = watchCalls(chained.cancelled, scope);
    const closed = watchCalls(chained.closed, scope);

    const opening = allSettled(parent.open, { scope, params: {} });
    await vi.waitFor(() =>
      expect(scope.getState(chained.$isPending)).toBe(true),
    );

    scopeBind(parent.close, { scope })();

    expect(scope.getState(chained.$isPending)).toBe(false);
    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalledTimes(1);

    resolve();
    await opening;
    expect(scope.getState(chained.$isOpened)).toBe(false);
  });

  test('ignores stale preparation results after a newer activation', async () => {
    let resolveFirst!: () => void;
    const parent = createVirtualRoute<
      RouteOpenedPayload<{ id: string }>,
      { id: string }
    >({ transformer: (payload) => payload.params });
    const prepareFx = createEffect(
      async (payload: RouteOpenedPayload<{ id: string }>) => {
        if (payload.params.id === 'first') {
          await new Promise<void>((done) => (resolveFirst = done));
        }
      },
    );
    const chained = chainRoute({ route: parent, beforeOpen: prepareFx });
    const scope = fork();

    const firstOpening = allSettled(parent.open, {
      scope,
      params: { params: { id: 'first' } },
    });
    await vi.waitFor(() =>
      expect(scope.getState(chained.$isPending)).toBe(true),
    );

    scopeBind(parent.open, { scope })({ params: { id: 'second' } });

    await vi.waitFor(() => {
      expect(scope.getState(chained.$isOpened)).toBe(true);
      expect(scope.getState(chained.$params)).toEqual({ id: 'second' });
    });

    resolveFirst();
    await firstOpening;

    expect(scope.getState(chained.$params)).toEqual({ id: 'second' });
  });
});
