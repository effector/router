// @vitest-environment happy-dom
import { allSettled, createWatch, fork, type Scope } from 'effector';
import { createBrowserHistory, createMemoryHistory } from 'history';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import {
  beforeNavigate,
  createRoute,
  createRouter,
  createRouterControls,
  historyAdapter,
  type Router,
} from '../lib';

const settle = async (ticks = 5) => {
  for (let i = 0; i < ticks; i++) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
};

/**
 * Browser/hash history v5 applies a blocked POP retry through `history.go()`, whose `popstate`
 * arrives asynchronously. The physical blocker must not be back in place by then, otherwise the
 * retry is intercepted as a fresh native navigation and Back loops between two URLs (#110, #117).
 */
describe('browser history: native Back with the shared blocker', () => {
  const syncGo = window.history.go.bind(window.history);
  const connected: { router: Router; scope: Scope }[] = [];

  const connect = async (router: Router, scope: Scope) => {
    connected.push({ router, scope });
    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(createBrowserHistory()),
    });
  };

  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    // Real browsers traverse history asynchronously (the HTML spec queues the traversal),
    // happy-dom does it synchronously. Emulate the browser: `popstate` lands after `go()` returns.
    window.history.go = (delta?: number) => {
      setTimeout(() => syncGo(delta), 0);
    };
    window.history.back = () => window.history.go(-1);
  });

  afterEach(async () => {
    // Detach routers from window history so their blockers don't leak into the next test.
    for (const { router, scope } of connected.splice(0)) {
      await allSettled(router.setHistory, {
        scope,
        params: historyAdapter(createMemoryHistory()),
      });
    }
    window.history.go = syncGo;
  });

  test('one Back press produces a single navigation to the previous route', async () => {
    const home = createRoute({ path: '/' });
    const profile = createRoute({ path: '/profile' });
    const router = createRouter({ routes: [home, profile] });
    const scope = fork();

    await connect(router, scope);
    await allSettled(profile.open, { scope, params: {} });
    expect(window.location.pathname).toBe('/profile');

    let pops = 0;
    const countPop = () => pops++;
    window.addEventListener('popstate', countPop);

    window.history.back();
    await settle(10);
    window.removeEventListener('popstate', countPop);

    expect(window.location.pathname).toBe('/');
    expect(scope.getState(home.$isOpened)).toBe(true);
    expect(scope.getState(profile.$isOpened)).toBe(false);
    // Back, the revert of the blocked POP and its retry; anything above means a loop.
    expect(pops).toBe(3);
  });

  test('the blocker is re-armed after the retried POP lands, so beforeNavigate keeps holding Back', async () => {
    const home = createRoute({ path: '/' });
    const profile = createRoute({ path: '/profile' });
    const controls = createRouterControls();
    const router = createRouter({ routes: [home, profile], controls });
    const guard = beforeNavigate({ controls, to: home });
    const scope = fork();
    let started = 0;
    createWatch({ unit: guard.started, scope, fn: () => started++ });

    await connect(router, scope);
    await allSettled(profile.open, { scope, params: {} });

    // held: the POP is reverted until the guard decides
    window.history.back();
    await settle();
    expect(started).toBe(1);
    expect(window.location.pathname).toBe('/profile');

    await allSettled(guard.proceed, { scope });
    await settle();
    expect(window.location.pathname).toBe('/');
    expect(scope.getState(home.$isOpened)).toBe(true);

    // a second Back is intercepted again — the blocker came back after the retry
    await allSettled(profile.open, { scope, params: {} });
    window.history.back();
    await settle();
    expect(started).toBe(2);
    expect(window.location.pathname).toBe('/profile');

    await allSettled(guard.cancel, { scope });
    await settle();
    expect(window.location.pathname).toBe('/profile');
    expect(scope.getState(profile.$isOpened)).toBe(true);
  });
});
