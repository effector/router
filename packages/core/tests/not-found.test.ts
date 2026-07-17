import { allSettled, fork } from 'effector';
import { createMemoryHistory } from 'history';
import { describe, expect, test } from 'vitest';
import { createRoute, createRouter, historyAdapter } from '../lib';

describe('notFound matrix', () => {
  test('limits a base router fallback to its base and handles query-only changes', async () => {
    const scope = fork();
    const fallback = createRoute();
    const router = createRouter({
      base: '/app',
      routes: [createRoute({ path: '/home' })],
      notFound: fallback,
    });
    const history = createMemoryHistory({ initialEntries: ['/outside'] });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    expect(scope.getState(fallback.$isOpened)).toBe(false);

    history.push('/app/missing?tab=one');
    await allSettled(scope);
    expect(scope.getState(fallback.$isOpened)).toBe(true);

    history.push('/app/missing?tab=two');
    await allSettled(scope);
    expect(scope.getState(fallback.$isOpened)).toBe(true);
    expect(scope.getState(router.$query)).toEqual({ tab: 'two' });
  });

  test('chooses the deepest fallback across multiple nested levels', async () => {
    const scope = fork();
    const rootFallback = createRoute();
    const settingsFallback = createRoute();
    const settings = createRouter({
      base: '/app/settings',
      routes: [createRoute({ path: '/' })],
      notFound: settingsFallback,
    });
    const router = createRouter({
      base: '/app',
      routes: [createRoute({ path: '/home' }), settings],
      notFound: rootFallback,
    });
    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    history.push('/app/settings/missing');
    await allSettled(scope);
    expect(scope.getState(settingsFallback.$isOpened)).toBe(true);
    expect(scope.getState(rootFallback.$isOpened)).toBe(false);

    history.push('/app/other');
    await allSettled(scope);
    expect(scope.getState(settingsFallback.$isOpened)).toBe(false);
    expect(scope.getState(rootFallback.$isOpened)).toBe(true);
  });

  test('leaves unknown locations inactive when no fallback is configured', async () => {
    const scope = fork();
    const route = createRoute({ path: '/known' });
    const router = createRouter({ routes: [route] });
    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    history.push('/unknown');
    await allSettled(scope);

    expect(scope.getState(route.$isOpened)).toBe(false);
    expect(scope.getState(router.$activeRoutes)).toEqual([]);
  });

  test('closes fallback after dynamic registration resolves the current path', async () => {
    const scope = fork();
    const fallback = createRoute();
    const router = createRouter({ routes: [], notFound: fallback });
    const history = createMemoryHistory({ initialEntries: ['/dynamic'] });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    expect(scope.getState(fallback.$isOpened)).toBe(true);

    const dynamic = createRoute({ path: '/dynamic' });
    router.registerRoute(dynamic);
    history.push('/dynamic?refresh=1');
    await allSettled(scope);

    expect(scope.getState(dynamic.$isOpened)).toBe(true);
    expect(scope.getState(fallback.$isOpened)).toBe(false);
  });

  test('keeps fallback state isolated between Fork scopes', async () => {
    const fallback = createRoute();
    const router = createRouter({ routes: [], notFound: fallback });
    const first = fork();
    const second = fork();

    await allSettled(router.setHistory, {
      scope: first,
      params: historyAdapter(createMemoryHistory({ initialEntries: ['/one'] })),
    });

    expect(first.getState(fallback.$isOpened)).toBe(true);
    expect(second.getState(fallback.$isOpened)).toBe(false);
  });
});
