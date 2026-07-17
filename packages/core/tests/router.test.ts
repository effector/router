import {
  allSettled,
  createEffect,
  createEvent,
  createWatch,
  fork,
  sample,
} from 'effector';
import { describe, expect, test, vi } from 'vitest';
import { createRoute, createRouter, historyAdapter } from '../lib';
import { createMemoryHistory } from 'history';
import { watchCalls } from './utils';

describe('router', () => {
  test('keeps null path and empty query before history, then replaces subscriptions atomically', async () => {
    const scope = fork();
    const route = createRoute({ path: '/one' });
    const router = createRouter({ routes: [route] });
    const first = createMemoryHistory({
      initialEntries: ['/one?source=first'],
    });
    const second = createMemoryHistory({
      initialEntries: ['/two?source=second'],
    });

    expect(scope.getState(router.$path)).toBeNull();
    expect(scope.getState(router.$query)).toStrictEqual({});

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(first),
    });
    expect(scope.getState(router.$path)).toBe('/one');
    expect(scope.getState(router.$query)).toStrictEqual({ source: 'first' });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(second),
    });
    expect(scope.getState(router.$path)).toBe('/two');
    expect(scope.getState(router.$query)).toStrictEqual({ source: 'second' });

    first.push('/stale');
    await allSettled(scope);
    expect(scope.getState(router.$path)).toBe('/two');
  });

  test('createRoute without a path is a self-contained virtual route', async () => {
    const scope = fork();
    const route = createRoute<{ id: string }>();

    await allSettled(route.open, {
      scope,
      params: { params: { id: 'one' } },
    });

    expect(scope.getState(route.$isOpened)).toBe(true);
    expect(scope.getState(route.$params)).toStrictEqual({ id: 'one' });
    expect(route).not.toHaveProperty('path');
  });

  test('normalizes equivalent empty payloads and does not merge params', async () => {
    const opened = vi.fn();

    for (const payload of [undefined, {}, { params: {} }] as const) {
      const scope = fork();
      const route = createRoute();
      route.opened.watch(opened);

      if (payload === undefined) {
        await allSettled(route.open as any, { scope });
      } else {
        await allSettled(route.open as any, { scope, params: payload });
      }

      expect(scope.getState(route.$params)).toStrictEqual({});
    }

    const scope = fork();
    const route = createRoute<{ id: string; slug: string }>();

    await allSettled(route.open, {
      scope,
      params: { params: { id: 'one', slug: 'first' } },
    });
    await allSettled(route.open, {
      scope,
      params: { params: { id: 'two' } as { id: string; slug: string } },
    });

    expect(scope.getState(route.$params)).toStrictEqual({ id: 'two' });
    expect(opened.mock.calls.slice(0, 3)).toEqual([[{}], [{}], [{}]]);
  });

  test('opens routes from history in the global scope (#56)', async () => {
    const route = createRoute({ path: '/profile' });
    const router = createRouter({ routes: [route] });
    const history = createMemoryHistory();

    router.setHistory(historyAdapter(history));

    await vi.waitFor(() => expect(router.$path.getState()).toBe('/'));

    history.push('/profile');

    await vi.waitFor(() => expect(route.$isOpened.getState()).toBe(true));
  });

  test('routes opened when path changed', async () => {
    const route1 = createRoute({ path: '/one' });
    const route2 = createRoute({ path: '/two' });

    const scope = fork();
    const history = createMemoryHistory();

    const router = createRouter({
      routes: [route1, route2],
    });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    history.push('/one');

    await allSettled(scope);

    expect(scope.getState(router.$activeRoutes)[0]).toEqual(route1);
    expect(scope.getState(route1.$isOpened)).toBeTruthy();
  });

  test('uses one match result for dynamically registered routes', async () => {
    const scope = fork();
    const router = createRouter({ routes: [] });
    const history = createMemoryHistory();
    const route = createRoute({ path: '/dynamic' });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    router.registerRoute(route);
    history.push('/dynamic');
    await allSettled(scope);

    expect(scope.getState(router.$activeRoutes)).toEqual([route]);
    expect(scope.getState(route.$isOpened)).toBe(true);
  });

  test('opens a root notFound route for unknown paths and closes it when restored', async () => {
    const scope = fork();
    const known = createRoute({ path: '/known' });
    const notFound = createRoute();
    const router = createRouter({ routes: [known], notFound });
    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    history.push('/missing');
    await allSettled(scope);

    expect(scope.getState(notFound.$isOpened)).toBe(true);
    expect(scope.getState(known.$isOpened)).toBe(false);
    expect(scope.getState(router.$activeRoutes)).toEqual([notFound]);

    history.push('/known');
    await allSettled(scope);

    expect(scope.getState(notFound.$isOpened)).toBe(false);
    expect(scope.getState(known.$isOpened)).toBe(true);
  });

  test('prefers a nested notFound route and propagates to the nearest fallback', async () => {
    const scope = fork();
    const rootNotFound = createRoute();
    const nestedNotFound = createRoute();
    const nested = createRouter({
      base: '/settings',
      routes: [createRoute({ path: '/' })],
      notFound: nestedNotFound,
    });
    const router = createRouter({
      routes: [createRoute({ path: '/' }), nested],
      notFound: rootNotFound,
    });
    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    history.push('/settings/missing');
    await allSettled(scope);

    expect(scope.getState(nestedNotFound.$isOpened)).toBe(true);
    expect(scope.getState(rootNotFound.$isOpened)).toBe(false);

    const nestedWithoutFallback = createRouter({
      base: '/admin',
      routes: [createRoute({ path: '/' })],
    });
    const rootWithPropagation = createRouter({
      routes: [nestedWithoutFallback],
      notFound: rootNotFound,
    });
    const secondHistory = createMemoryHistory();

    await allSettled(rootWithPropagation.setHistory, {
      scope,
      params: historyAdapter(secondHistory),
    });
    secondHistory.push('/admin/missing');
    await allSettled(scope);

    expect(scope.getState(rootNotFound.$isOpened)).toBe(true);
  });

  test('routes closed when path changed', async () => {
    const route1 = createRoute({ path: '/one' });
    const route2 = createRoute({ path: '/two' });

    const scope = fork();
    const history = createMemoryHistory();

    const router = createRouter({
      routes: [route1, route2],
    });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    history.push('/one');

    await allSettled(scope);

    expect(scope.getState(router.$activeRoutes)[0]).toEqual(route1);
    expect(scope.getState(route1.$isOpened)).toBeTruthy();

    history.push('/two');

    await allSettled(scope);

    expect(scope.getState(router.$activeRoutes)[0]).toEqual(route2);
    expect(scope.getState(route2.$isOpened)).toBeTruthy();
  });

  test('closes previous route before opening next route', async () => {
    const route1 = createRoute({ path: '/one' });
    const route2 = createRoute({ path: '/two' });
    const events: string[] = [];

    const scope = fork();
    const history = createMemoryHistory();

    createWatch({
      unit: route1.closed,
      scope,
      fn: () => events.push('route1.closed'),
    });

    createWatch({
      unit: route2.opened,
      scope,
      fn: () => events.push('route2.opened'),
    });

    const router = createRouter({
      // Keep the target route before the currently opened route to verify that
      // lifecycle order does not depend on the declaration order.
      routes: [route2, route1],
    });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    history.push('/one');
    await allSettled(scope);

    events.length = 0;

    history.push('/two');
    await allSettled(scope);

    expect(events).toEqual(['route1.closed', 'route2.opened']);
  });

  test('routes changed path when opened', async () => {
    const route1 = createRoute({ path: '/one' });
    const route2 = createRoute({ path: '/two/:id' });
    const nested = createRoute({ parent: route1, path: '/nested/:id' });

    const scope = fork();
    const history = createMemoryHistory();

    const router = createRouter({
      routes: [route1, route2, nested],
    });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    await allSettled(route1.open, { scope, params: {} });

    expect(history.location.pathname).toBe('/one');

    await allSettled(route2.open, {
      scope,
      params: { params: { id: 'hello' } },
    });

    expect(history.location.pathname).toBe('/two/hello');

    await allSettled(nested.open, {
      scope,
      params: { params: { id: 'hello' } },
    });

    expect(history.location.pathname).toBe('/one/nested/hello');
  });

  test('navigate with query', async () => {
    const scope = fork();
    const route = createRoute({ path: '/auth' });
    const router = createRouter({
      routes: [route],
    });

    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    history.push('/auth?login=johndoe&password=123&retry=1&retry=1');

    await vi.waitFor(
      () => expect(scope.getState(router.$activeRoutes)[0]).toEqual(route),
      { timeout: 100 },
    );

    expect(scope.getState(router.$query)).toStrictEqual({
      login: 'johndoe',
      password: '123',
      retry: ['1', '1'],
    });
  });

  test('route.open with query', async () => {
    const scope = fork();
    const route = createRoute({ path: '/auth' });
    const router = createRouter({
      routes: [route],
    });

    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    await allSettled(route.open, {
      scope,
      params: {
        query: { login: 'johndoe', password: '123', retry: ['1', '1'] },
      },
    });

    expect(history.location.pathname).toBe('/auth');
    expect(history.location.search).toBe(
      '?login=johndoe&password=123&retry=1&retry=1',
    );
  });

  test('navigate with params', async () => {});

  test('route.open with params', async () => {});

  test('route not opened when history blocked', async () => {
    const scope = fork();
    const route1 = createRoute({ path: '/step1' });
    const route2 = createRoute({ path: '/step2' });

    const router = createRouter({ routes: [route1, route2] });
    const history = createMemoryHistory({ initialEntries: ['/step1'] });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    history.block(() => false);
    await allSettled(route2.open, { scope, params: {} });

    expect(scope.getState(router.$activeRoutes)[0]).toEqual(route1);
    expect(scope.getState(route1.$isOpened)).toBeTruthy();
    expect(scope.getState(route2.$isOpened)).toBeFalsy();
  });

  test('beforeOpen on route', async () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();

    const scope = fork();

    const route1 = createRoute({
      path: '/step1',
      beforeOpen: [createEffect(fn1)],
    });

    const route2 = createRoute({
      path: '/step2',
      beforeOpen: [createEffect(fn2)],
    });

    const router = createRouter({ routes: [route1, route2] });
    const history = createMemoryHistory({ initialEntries: ['/step1'] });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    expect(fn1).toBeCalled();

    history.push('/step2');
    await allSettled(scope);

    expect(fn2).toBeCalled();
  });

  test('beforeOpen runs once for one route.open navigation', async () => {
    const beforeOpen = vi.fn();
    const route = createRoute({
      path: '/profile',
      beforeOpen: [createEffect(beforeOpen)],
    });
    const router = createRouter({ routes: [route] });
    const scope = fork();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(createMemoryHistory()),
    });

    await allSettled(route.open, { scope, params: {} });

    expect(beforeOpen).toHaveBeenCalledTimes(1);
    expect(scope.getState(route.$isOpened)).toBe(true);
  });

  test('beforeOpen failure closes a previously opened route', async () => {
    let shouldFail = false;
    const beforeOpenFx = createEffect(() => {
      if (shouldFail) throw new Error('preparation failed');
    });
    const route = createRoute({ path: '/profile', beforeOpen: [beforeOpenFx] });
    const router = createRouter({ routes: [route] });
    const history = createMemoryHistory();
    const scope = fork();
    const closed = watchCalls(route.closed, scope);

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    await allSettled(route.open, { scope, params: {} });

    expect(scope.getState(route.$isOpened)).toBe(true);
    closed.mockClear();

    shouldFail = true;
    await allSettled(route.open, { scope, params: {} });

    expect(history.location.pathname).toBe('/profile');
    expect(scope.getState(route.$isOpened)).toBe(false);
    expect(closed).toHaveBeenCalledTimes(1);
  });

  test('parent route is opened', async () => {
    const scope = fork();

    const parent = createRoute({ path: '/parent' });
    const child = createRoute({ path: '/child', parent });

    const router = createRouter({ routes: [parent, child] });
    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    history.push('/parent/child');
    await allSettled(scope);

    expect(scope.getState(parent.$isOpened)).toBeTruthy();
    expect(scope.getState(child.$isOpened)).toBeTruthy();
  });

  test('child params include parent params while parent keeps its own params', async () => {
    const scope = fork();
    const parent = createRoute({ path: '/users/:userId' });
    const child = createRoute({ path: '/posts/:postId', parent });
    const router = createRouter({ routes: [parent, child] });
    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    history.push('/users/alice/posts/one');
    await allSettled(scope);

    expect(scope.getState(parent.$params)).toStrictEqual({ userId: 'alice' });
    expect(scope.getState(child.$params)).toStrictEqual({
      userId: 'alice',
      postId: 'one',
    });
  });

  test('route compatibility matrix covers deep parents, SSR, Fork, and virtual history isolation', async () => {
    const scope = fork();
    const root = createRoute({ path: '/teams/:teamId' });
    const section = createRoute({ path: '/sections/:sectionId', parent: root });
    const page = createRoute({ path: '/pages/:pageId', parent: section });
    const router = createRouter({ routes: [root, section, page] });
    const history = createMemoryHistory();
    const serverOpened = vi.fn();

    root.openedOnServer.watch(serverOpened);

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    history.push('/teams/acme/sections/core/pages/overview');
    await allSettled(scope);

    expect(scope.getState(page.$params)).toStrictEqual({
      teamId: 'acme',
      sectionId: 'core',
      pageId: 'overview',
    });
    expect(serverOpened).toHaveBeenCalled();

    const virtual = createRoute();
    const isolatedHistory = createMemoryHistory();
    await allSettled(virtual.open, { scope, params: undefined });

    expect(scope.getState(virtual.$isOpened)).toBe(true);
    expect(isolatedHistory.location.pathname).toBe('/');
  });

  test('deduplicates equal route params updates', async () => {
    const scope = fork();
    const route = createRoute({ path: '/profile/:id' });
    const router = createRouter({ routes: [route] });
    const history = createMemoryHistory();
    const updated = vi.fn();
    const paramsUpdated = vi.fn();

    route.updated.watch(updated);
    route.$params.updates.watch(paramsUpdated);

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    history.push('/profile/first');
    await allSettled(scope);
    history.push('/profile/first');
    await allSettled(scope);
    history.push('/profile/second');
    await allSettled(scope);

    expect(updated).toHaveBeenCalledTimes(1);
    expect(updated).toHaveBeenNthCalledWith(1, {
      params: { id: 'second' },
    });
    expect(paramsUpdated).toHaveBeenCalledTimes(2);
  });

  test('compares params by values, preserving array order and key presence', async () => {
    const scope = fork();
    const route = createRoute<{
      values: string[];
      marker?: string | null;
    }>();
    const updated = vi.fn();
    route.updated.watch(updated);

    await allSettled(route.open, {
      scope,
      params: { params: { values: ['one', 'two'], marker: null } },
    });
    await allSettled(route.open, {
      scope,
      params: { params: { marker: null, values: ['two', 'one'] } },
    });
    await allSettled(route.open, {
      scope,
      params: { params: { values: ['two', 'one'] } },
    });
    await allSettled(route.close, { scope });

    expect(updated).toHaveBeenCalledTimes(2);
    expect(updated).toHaveBeenNthCalledWith(1, {
      params: { marker: null, values: ['two', 'one'] },
    });
    expect(updated).toHaveBeenNthCalledWith(2, {
      params: { values: ['two', 'one'] },
    });
  });

  test('subrouter', async () => {
    const scope = fork();

    const settingsModalRoutes = {
      general: createRoute({ path: '/' }),
      security: createRoute({ path: '/security' }),
    };

    const settingsModalRouter = createRouter({
      base: '/settings',
      routes: [settingsModalRoutes.general, settingsModalRoutes.security],
    });

    const mainRoutes = {
      home: createRoute({ path: '/' }),
    };

    const mainRouter = createRouter({
      routes: [mainRoutes.home, settingsModalRouter],
    });

    await allSettled(mainRouter.setHistory, {
      scope,
      params: historyAdapter(createMemoryHistory()),
    });

    await allSettled(mainRoutes.home.open, { scope, params: {} });

    expect(scope.getState(mainRoutes.home.$isOpened)).toBeTrueWithMessage(
      'home route should be opened',
    );
    expect(
      scope.getState(settingsModalRoutes.general.$isOpened),
    ).toBeFalseWithMessage('settings modal general route should be closed');

    await allSettled(settingsModalRoutes.general.open, { scope, params: {} });

    expect(scope.getState(mainRoutes.home.$isOpened)).toBeFalseWithMessage(
      'home route should be closed',
    );
    expect(
      scope.getState(settingsModalRoutes.general.$isOpened),
    ).toBeTrueWithMessage('settings modal general route should be opened');

    await allSettled(settingsModalRoutes.security.open, { scope, params: {} });

    expect(scope.getState(mainRoutes.home.$isOpened)).toBeFalseWithMessage(
      'home route should be closed',
    );
    expect(
      scope.getState(settingsModalRoutes.general.$isOpened),
    ).toBeFalseWithMessage('settings modal general route should be closed');
    expect(
      scope.getState(settingsModalRoutes.security.$isOpened),
    ).toBeTrueWithMessage('settings modal security route should be opened');
  });

  test('opened can open another route', async () => {
    const scope = fork();

    const routes = {
      home: createRoute({ path: '/' }),
      flightSearch: createRoute({ path: '/search' }),
    };

    const router = createRouter({
      routes: [routes.home, routes.flightSearch],
    });

    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    sample({
      clock: routes.home.opened,
      target: routes.flightSearch.open,
    });

    await allSettled(routes.home.open, { scope, params: {} });

    expect(history.location.pathname).toBe('/search');
    expect(scope.getState(routes.home.$isOpened)).toBeFalsy();
    expect(scope.getState(routes.flightSearch.$isOpened)).toBeTruthy();
  });

  test('route opened only once', async () => {
    const scope = fork();
    const appStarted = createEvent();

    const routes = {
      example: createRoute({
        path: '/',
      }),
    };

    const router = createRouter({
      routes: [routes.example],
    });

    sample({
      clock: appStarted,
      fn: () => historyAdapter(createMemoryHistory()),
      target: router.setHistory,
    });

    const calls = watchCalls(routes.example.opened, scope);

    await allSettled(appStarted, { scope });

    expect(calls).toBeCalledTimes(1);
  });

  test('parent route stays open when switching between child routes', async () => {
    const profile = createRoute({ path: '/profile' });
    const settings = createRoute({ path: '/settings', parent: profile });
    const friends = createRoute({ path: '/friends', parent: profile });
    const router = createRouter({ routes: [profile, settings, friends] });
    const scope = fork();
    const history = createMemoryHistory({
      initialEntries: ['/profile/settings'],
    });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const parentClosed = watchCalls(profile.closed, scope);

    await allSettled(friends.open, { scope, params: undefined });

    // The shared parent must not close while a sibling child takes over; a
    // binding subscribed through useSyncExternalStore would otherwise unmount
    // and remount the parent view. `$isOpened` must never emit false here.
    expect(parentClosed).toBeCalledTimes(0);
    expect(scope.getState(profile.$isOpened)).toBe(true);
    expect(scope.getState(settings.$isOpened)).toBe(false);
    expect(scope.getState(friends.$isOpened)).toBe(true);
  });
});
