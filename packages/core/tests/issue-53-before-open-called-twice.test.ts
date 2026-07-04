import { allSettled, createEffect, fork } from 'effector';
import { describe, expect, test, vi } from 'vitest';
import { createRoute, createRouter, historyAdapter } from '../lib';
import { createMemoryHistory } from 'history';

/**
 * Reproduction of https://github.com/effector/router/issues/53
 *
 * When a route with a `beforeOpen` handler is opened through the public `open`
 * API (which is exactly what `<Link>` does under the hood), the `beforeOpen`
 * effects are executed twice for a single navigation. During that extra pending
 * window the route is not yet `$isOpened`, which is what surfaces the spurious
 * "404" flash reported in the issue.
 */
describe('issue #30: beforeOpen is called twice during link navigation', () => {
  test('beforeOpen runs exactly once when opening via route.open (Link click)', async () => {
    const beforeOpenFn = vi.fn();

    const scope = fork();

    // Mirrors the reproduction repo: an async beforeOpen effect on `/profile`.
    const profile = createRoute({
      path: '/profile',
      beforeOpen: [createEffect(beforeOpenFn)],
    });
    const feed = createRoute({ path: '/' });

    const router = createRouter({ routes: [feed, profile] });
    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    // `<Link to={routes.profile}>` navigation is `route.open()`.
    await allSettled(profile.open, { scope, params: {} });

    expect(history.location.pathname).toBe('/profile');
    expect(scope.getState(profile.$isOpened)).toBe(true);

    // The core of the issue: the handler must run once, not twice.
    expect(beforeOpenFn).toBeCalledTimes(1);
  });

  test('route never stays pending / unopened after navigation settles (no 404 flash)', async () => {
    const scope = fork();

    const profile = createRoute({
      path: '/profile',
      beforeOpen: [
        createEffect(async () => {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }),
      ],
    });
    const feed = createRoute({ path: '/' });

    const router = createRouter({ routes: [feed, profile] });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(createMemoryHistory()),
    });

    await allSettled(profile.open, { scope, params: {} });

    // After everything settles the route is opened and not pending — the
    // transient "404 page" reported in the issue must not linger.
    expect(scope.getState(profile.$isOpened)).toBe(true);
    expect(scope.getState(profile.$isPending)).toBe(false);
    expect(scope.getState(router.$activeRoutes)).toContain(profile);
  });
});
