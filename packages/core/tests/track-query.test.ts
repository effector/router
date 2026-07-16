import { allSettled, createEffect, createStore, fork, sample } from 'effector';
import { createMemoryHistory } from 'history';
import { describe, expect, test, vi } from 'vitest';
import {
  createRouter,
  createRouterControls,
  createRoute,
  historyAdapter,
  trackQuery,
} from '../lib';
import { watchCalls } from './utils';
import z from 'zod/v4';

async function prepare() {
  const routes = {
    home: createRoute({ path: '/' }),
    app: createRoute({ path: '/app' }),
  };

  const scope = fork();
  const history = createMemoryHistory({ initialEntries: ['/'] });
  const controls = createRouterControls();
  const router = createRouter({
    routes: [routes.home, routes.app],
    controls,
  });

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(history),
  });

  return { routes, scope, history, router, controls };
}

describe('trackQuery', () => {
  test('number parameter', async () => {
    const { router, scope, controls } = await prepare();
    const tracker = trackQuery({
      controls,
      parameters: z.object({
        num: z.coerce.number(),
      }),
    });

    const enteredCalls = watchCalls(tracker.entered, scope);
    const exitedCalls = watchCalls(tracker.exited, scope);

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { num: '1200' } },
    });

    expect(enteredCalls).toBeCalledWith({ num: 1200 });

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { num: 'hello' } },
    });

    expect(enteredCalls).toBeCalledTimes(1);
    expect(exitedCalls).toBeCalledTimes(1);

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { num: ['hello', '1200'] } },
    });

    expect(enteredCalls).toBeCalledTimes(1);
    expect(exitedCalls).toBeCalledTimes(1);
  });

  test('string parameter', async () => {
    const { router, scope, controls } = await prepare();
    const tracker = trackQuery({
      controls,
      parameters: z.object({
        str: z.string(),
      }),
    });

    const enteredCalls = watchCalls(tracker.entered, scope);
    const exitedCalls = watchCalls(tracker.exited, scope);

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { str: '1200' } },
    });

    expect(enteredCalls).toBeCalledWith({ str: '1200' });

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { str: 'hello' } },
    });

    expect(enteredCalls).toBeCalledWith({ str: 'hello' });

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { str: ['hello', '1200'] } },
    });

    expect(enteredCalls).toBeCalledTimes(2);
    expect(exitedCalls).toBeCalledTimes(1);
  });

  test('any parameter', async () => {
    const { router, scope, controls } = await prepare();
    const tracker = trackQuery({
      controls,
      parameters: z.object({
        any: z.any().refine((value) => value !== undefined),
      }),
    });

    const enteredCalls = watchCalls(tracker.entered, scope);
    const exitedCalls = watchCalls(tracker.exited, scope);

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { any: '1200' } },
    });

    expect(enteredCalls).toBeCalledWith({ any: '1200' });

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { any: 'hello' } },
    });

    expect(enteredCalls).toBeCalledWith({ any: 'hello' });

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { any: ['hello', '1200'] } },
    });

    expect(enteredCalls).toBeCalledWith({ any: ['hello', '1200'] });

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: {} },
    });

    expect(enteredCalls).toBeCalledTimes(3);
    expect(exitedCalls).toBeCalledTimes(1);
  });

  test('array parameter', async () => {
    const { router, scope, controls } = await prepare();
    const tracker = trackQuery({
      controls,
      parameters: z.object({
        any: z.any().refine((value) => value !== undefined),
      }),
    });

    const enteredCalls = watchCalls(tracker.entered, scope);
    const exitedCalls = watchCalls(tracker.exited, scope);

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { any: ['hello', '1200'] } },
    });

    expect(enteredCalls).toBeCalledWith({ any: ['hello', '1200'] });

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: {} },
    });

    expect(enteredCalls).toBeCalledTimes(1);
    expect(exitedCalls).toBeCalledTimes(1);
  });

  test('boolean parameter', async () => {
    const { router, scope, controls } = await prepare();
    const tracker = trackQuery({
      controls,
      parameters: z.object({
        bool: z
          .string()
          .refine((bool) => ['0', '1', 'false', 'true'].includes(bool))
          .transform((schema) => ['1', 'true'].includes(schema)),
      }),
    });

    const enteredCalls = watchCalls(tracker.entered, scope);
    const exitedCalls = watchCalls(tracker.exited, scope);

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { bool: '0' } },
    });

    expect(enteredCalls).toBeCalledWith({ bool: false });

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { bool: '1' } },
    });

    expect(enteredCalls).toBeCalledWith({ bool: true });

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { bool: 'false' } },
    });

    expect(enteredCalls).toBeCalledWith({ bool: false });

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { bool: 'true' } },
    });

    expect(enteredCalls).toBeCalledWith({ bool: true });

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { bool: '123' } },
    });

    expect(enteredCalls).toBeCalledTimes(4);
    expect(exitedCalls).toBeCalledTimes(1);

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { bool: 'hello' } },
    });

    expect(enteredCalls).toBeCalledTimes(4);
    expect(exitedCalls).toBeCalledTimes(1);

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { bool: ['0', 'hello'] } },
    });

    expect(enteredCalls).toBeCalledTimes(4);
    expect(exitedCalls).toBeCalledTimes(1);
  });

  test('for routes', async () => {
    const { router, routes, scope, controls } = await prepare();
    const tracker = trackQuery({
      controls,
      parameters: z.object({
        any: z.any().refine((value) => value !== undefined),
      }),
      routes: [routes.app, routes.home],
    });

    const enteredCalls = watchCalls(tracker.entered, scope);
    const exitedCalls = watchCalls(tracker.exited, scope);

    await allSettled(router.navigate, {
      params: { path: '/not-found', query: { any: '123' } },
      scope,
    });

    expect(enteredCalls).not.toBeCalled();

    await allSettled(router.navigate, {
      params: { path: '/app', query: { any: '123' } },
      scope,
    });

    expect(enteredCalls).toBeCalledTimes(1);

    await allSettled(router.navigate, {
      params: { path: '/', query: { any: '123' } },
      scope,
    });

    expect(enteredCalls).toBeCalledTimes(2);

    await allSettled(router.navigate, {
      params: { path: '/not-found', query: { any: '123' } },
      scope,
    });

    expect(exitedCalls).toBeCalledTimes(1);
  });

  test('stays inactive for an empty route selection', async () => {
    const { router, scope, controls } = await prepare();
    const tracker = trackQuery({
      controls,
      routes: [],
      parameters: z.object({ id: z.string() }),
    });
    const enteredCalls = watchCalls(tracker.entered, scope);

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { id: '123' } },
    });

    expect(enteredCalls).not.toHaveBeenCalled();
  });

  test('waits for the selected route activation without timing assumptions', async () => {
    let releasePreparation!: () => void;
    const prepareAppFx = createEffect(
      () =>
        new Promise<void>((resolve) => {
          releasePreparation = resolve;
        }),
    );
    const routes = {
      home: createRoute({ path: '/' }),
      app: createRoute({ path: '/app', beforeOpen: [prepareAppFx] }),
    };
    const controls = createRouterControls();
    const router = createRouter({ routes: Object.values(routes), controls });
    const scope = fork();
    const tracker = trackQuery({
      controls,
      routes: Object.values(routes),
      parameters: z.object({ id: z.string() }),
    });
    const enteredCalls = watchCalls(tracker.entered, scope);
    const exitedCalls = watchCalls(tracker.exited, scope);

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(createMemoryHistory({ initialEntries: ['/'] })),
    });
    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { id: 'home' } },
    });

    const navigation = allSettled(router.navigate, {
      scope,
      params: { path: '/app', query: { id: 'app' } },
    });

    await vi.waitFor(() => {
      expect(scope.getState(routes.app.$isPending)).toBe(true);
    });
    expect(enteredCalls).toHaveBeenCalledTimes(1);
    expect(enteredCalls).toHaveBeenLastCalledWith({ id: 'home' });
    expect(exitedCalls).not.toHaveBeenCalled();

    releasePreparation();
    await navigation;

    expect(enteredCalls).toHaveBeenCalledTimes(2);
    expect(enteredCalls).toHaveBeenLastCalledWith({ id: 'app' });
    expect(exitedCalls).not.toHaveBeenCalled();
  });

  test('exits after the selected route activation fails', async () => {
    const prepareAppFx = createEffect<void, void>(() => {
      throw new Error('preparation failed');
    });
    const routes = {
      home: createRoute({ path: '/' }),
      app: createRoute({ path: '/app', beforeOpen: [prepareAppFx] }),
    };
    const controls = createRouterControls();
    const router = createRouter({ routes: Object.values(routes), controls });
    const scope = fork();
    const tracker = trackQuery({
      controls,
      routes: Object.values(routes),
      parameters: z.object({ id: z.string() }),
    });
    const enteredCalls = watchCalls(tracker.entered, scope);
    const exitedCalls = watchCalls(tracker.exited, scope);

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(createMemoryHistory({ initialEntries: ['/'] })),
    });
    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { id: 'home' } },
    });
    await allSettled(router.navigate, {
      scope,
      params: { path: '/app', query: { id: 'app' } },
    });

    expect(enteredCalls).toHaveBeenCalledTimes(1);
    expect(exitedCalls).toHaveBeenCalledTimes(1);
    expect(scope.getState(routes.app.$isOpened)).toBe(false);
    expect(scope.getState(routes.app.$isPending)).toBe(false);
  });

  test('stabilizes activity across mapped pathless routes', async () => {
    const routes = {
      one: createRoute(),
      two: createRoute(),
    };
    const controls = createRouterControls();
    const router = createRouter({
      routes: [
        { path: '/one', route: routes.one },
        { path: '/two', route: routes.two },
      ],
      controls,
    });
    const scope = fork();
    const tracker = trackQuery({
      controls,
      routes: Object.values(routes),
      parameters: z.object({ id: z.string() }),
    });
    const enteredCalls = watchCalls(tracker.entered, scope);
    const exitedCalls = watchCalls(tracker.exited, scope);

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(createMemoryHistory({ initialEntries: ['/one'] })),
    });
    await allSettled(router.navigate, {
      scope,
      params: { path: '/one', query: { id: 'one' } },
    });
    await allSettled(router.navigate, {
      scope,
      params: { path: '/two', query: { id: 'two' } },
    });

    expect(enteredCalls).toHaveBeenNthCalledWith(1, { id: 'one' });
    expect(enteredCalls).toHaveBeenNthCalledWith(2, { id: 'two' });
    expect(exitedCalls).not.toHaveBeenCalled();

    await allSettled(routes.two.close, { scope });

    expect(exitedCalls).toHaveBeenCalledTimes(1);
  });

  test('exit', async () => {
    const { router, routes, scope, controls } = await prepare();
    const tracker = trackQuery({
      controls,
      parameters: z.object({
        any: z.any().refine((value) => value !== undefined),
      }),
      routes: [routes.app, routes.home],
    });

    const exitedCalls = watchCalls(tracker.exited, scope);

    await allSettled(router.navigate, {
      params: { path: '/not-found', query: { any: '123' } },
      scope,
    });

    await allSettled(tracker.exit, { scope, params: undefined });

    expect(exitedCalls).not.toBeCalled();

    await allSettled(router.navigate, {
      params: { path: '/', query: { any: '123', uid: 'hi!' } },
      scope,
    });

    await allSettled(tracker.exit, { scope, params: undefined });

    expect(exitedCalls).toBeCalled();
    expect(scope.getState(router.$query)).toStrictEqual({ uid: 'hi!' });
  });

  test('ignore parameters', async () => {
    const { router, routes, scope, controls } = await prepare();
    const tracker = trackQuery({
      controls,
      parameters: z.object({
        any: z.any().refine((value) => value !== undefined),
      }),
      routes: [routes.app, routes.home],
    });

    const exitedCalls = watchCalls(tracker.exited, scope);

    await allSettled(router.navigate, {
      params: { path: '/not-found', query: { any: '123' } },
      scope,
    });

    await allSettled(tracker.exit, { scope, params: undefined });

    expect(exitedCalls).not.toBeCalled();

    await allSettled(router.navigate, {
      params: { path: '/', query: { any: '123', uid: 'hi!' } },
      scope,
    });

    await allSettled(tracker.exit, {
      scope,
      params: { ignoreParams: ['uid'] },
    });

    expect(exitedCalls).toBeCalled();
    expect(scope.getState(router.$query)).toStrictEqual({ uid: 'hi!' });
  });

  test('exit removes only schema-owned keys and preserves unrelated query', async () => {
    const { router, scope, controls } = await prepare();
    const tracker = trackQuery({
      controls,
      parameters: z.object({ any: z.string() }),
    });

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { any: '123', uid: 'hi!' } },
    });
    await allSettled(tracker.exit, { scope, params: undefined });

    expect(scope.getState(router.$query)).toStrictEqual({ uid: 'hi!' });
  });

  test('enter', async () => {
    const { router, routes, scope, history, controls } = await prepare();
    const tracker = trackQuery({
      controls,
      parameters: z.object({
        id: z.coerce.number(),
        role: z.enum(['user', 'admin']),
      }),
      routes: [routes.app, routes.home],
    });

    await allSettled(tracker.enter, {
      params: { id: '0', role: 'user' },
      scope,
    });

    expect(scope.getState(router.$query)).toStrictEqual({
      id: '0',
      role: 'user',
    });
    expect(history.location.search).toBe('?id=0&role=user');

    await allSettled(tracker.enter, {
      params: { id: '1', role: 'admin' },
      scope,
    });

    expect(scope.getState(router.$query)).toStrictEqual({
      id: '1',
      role: 'admin',
    });
    expect(history.location.search).toBe('?id=1&role=admin');
  });

  test('reacts automatically to query and route activity', async () => {
    const { router, routes, scope, controls } = await prepare();
    const tracker = trackQuery({
      controls,
      routes: [routes.home],
      parameters: z.object({ id: z.string() }),
    });
    const enteredCalls = watchCalls(tracker.entered, scope);

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { id: '123' } },
    });

    expect(enteredCalls).toHaveBeenCalledWith({ id: '123' });
  });

  test('maps parsed query parameters into a store', async () => {
    const { router, routes, scope, controls } = await prepare();
    const tracker = trackQuery({
      controls,
      parameters: z.object({
        q: z.string(),
        page: z.coerce.number().default(1),
      }),
      routes: [routes.home],
    });
    const $searchQuery = createStore({ q: '', page: 1 });

    sample({
      clock: tracker.entered,
      target: $searchQuery,
    });

    await allSettled(router.navigate, {
      scope,
      params: { path: '/', query: { q: 'router', page: '2' } },
    });

    expect(scope.getState($searchQuery)).toEqual({ q: 'router', page: 2 });
  });

  test('keeps automatic tracking isolated between forked scopes', async () => {
    const routes = { home: createRoute({ path: '/' }) };
    const controls = createRouterControls();
    const router = createRouter({ routes: [routes.home], controls });
    const tracker = trackQuery({
      controls,
      routes: [routes.home],
      parameters: z.object({ q: z.string() }),
    });
    const scopeA = fork();
    const scopeB = fork();
    const enteredA = watchCalls(tracker.entered, scopeA);
    const enteredB = watchCalls(tracker.entered, scopeB);

    await allSettled(router.setHistory, {
      scope: scopeA,
      params: historyAdapter(createMemoryHistory({ initialEntries: ['/'] })),
    });
    await allSettled(router.setHistory, {
      scope: scopeB,
      params: historyAdapter(createMemoryHistory({ initialEntries: ['/'] })),
    });

    await allSettled(router.navigate, {
      scope: scopeA,
      params: { path: '/not-found', query: { q: 'a' } },
    });

    expect(scopeA.getState(controls.$query)).toStrictEqual({ q: 'a' });
    expect(scopeB.getState(controls.$query)).toStrictEqual({});
    expect(enteredA).not.toHaveBeenCalled();
    expect(enteredB).not.toHaveBeenCalled();

    await allSettled(router.navigate, {
      scope: scopeB,
      params: { path: '/', query: { q: 'b' } },
    });

    expect(scopeA.getState(controls.$query)).toStrictEqual({ q: 'a' });
    expect(scopeB.getState(controls.$query)).toStrictEqual({ q: 'b' });
    expect(enteredB).toHaveBeenCalledWith({ q: 'b' });

    await allSettled(router.navigate, {
      scope: scopeA,
      params: { path: '/', query: { q: 'a' } },
    });

    expect(enteredA).toHaveBeenCalledWith({ q: 'a' });
    expect(controls.$query.getState()).toStrictEqual({});
    expect(routes.home.$isOpened.getState()).toBe(false);
  });
});
