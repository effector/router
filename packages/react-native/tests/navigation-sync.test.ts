import { createEvent, createStore, fork, allSettled } from 'effector';
import type { Router, Route } from '@effector/router';
import type { RouteView } from '@effector/router-react';
import { describe, expect, test, vi } from 'vitest';
import { createRouterSync, syncActiveRoute } from '../lib/navigation-sync';

function createSyncHarness() {
  const home = {
    path: '/home',
    $params: createStore({}),
    opened: createEvent(),
  } as unknown as Route<any>;
  const profile = {
    path: '/profile/:id',
    $params: createStore({ id: 'initial' }),
    opened: createEvent(),
  } as unknown as Route<any>;
  const activeChanged = createEvent<Route<any>[]>();
  const $activeRoutes = createStore<Route<any>[]>([]).on(
    activeChanged,
    (_, routes) => routes,
  );
  const router = { $activeRoutes } as unknown as Router;
  const routes: RouteView[] = [
    { route: home, view: () => null },
    { route: profile, view: () => null },
  ];

  return { home, profile, activeChanged, router, routes };
}

describe('React Navigation synchronization', () => {
  test('navigates the real navigation object to the last active route (#71)', () => {
    const home = { path: '/home' } as Route<any>;
    const profile = { path: '/profile' } as Route<any>;
    const routes: RouteView[] = [
      { route: home, view: () => null },
      { route: profile, view: () => null },
    ];
    const navigate = vi.fn();

    syncActiveRoute({ navigate }, [home, profile], routes);

    expect(navigate).toHaveBeenCalledWith('/profile');
  });

  test('keeps only the latest Router target before native readiness', async () => {
    const { profile, activeChanged, router, routes } = createSyncHarness();
    const scope = fork();
    const navigate = vi.fn();
    const sync = createRouterSync({
      router,
      routes,
      scope,
      navigation: { navigate },
    });

    await allSettled(activeChanged, { scope, params: [profile] });
    expect(navigate).not.toHaveBeenCalled();

    sync.onSnapshot({ route: { name: '/home' } });
    expect(navigate).toHaveBeenCalledWith('/profile/:id', { id: 'initial' });
    sync.cleanup();
  });

  test('uses replace for a Router replace intent and suppresses native echo', async () => {
    const { home, profile, activeChanged, router, routes } =
      createSyncHarness();
    const scope = fork();
    const navigate = vi.fn();
    const replace = vi.fn();
    const sync = createRouterSync({
      router,
      routes,
      scope,
      navigation: { navigate, replace },
    });

    sync.onSnapshot({ route: { name: '/home' } });
    await allSettled(activeChanged, { scope, params: [profile] });
    expect(navigate).toHaveBeenCalledWith('/profile/:id', { id: 'initial' });

    await allSettled(profile.opened as any, {
      scope,
      params: { params: { id: 'next' }, replace: true },
    });
    expect(replace).toHaveBeenCalledWith('/profile/:id', { id: 'next' });

    sync.onSnapshot({
      route: { name: '/profile/:id', params: { id: 'next' } },
    });
    await allSettled(activeChanged, { scope, params: [home] });
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenLastCalledWith('/home');
    sync.cleanup();
  });
});
