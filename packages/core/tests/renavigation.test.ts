import { allSettled, fork } from 'effector';
import { describe, expect, test } from 'vitest';
import { createRoute, createRouter, historyAdapter } from '../lib';
import { createMemoryHistory } from 'history';
import { watchCalls } from './utils';

// Characterization of `create-router` `shouldNavigate`: it decides when a
// committed location re-activates matching routes. These assertions pin the
// exact opened/updated/closed emissions so the readability refactor of that
// predicate (named booleans) cannot change behavior. See D3.4/D4.
describe('re-navigation emission matrix', () => {
  async function setup() {
    const route = createRoute({ path: '/post/:id' });
    const other = createRoute({ path: '/about' });
    const router = createRouter({ routes: [route, other] });
    const scope = fork();
    const history = createMemoryHistory({ initialEntries: ['/post/1'] });

    const opened = watchCalls(route.opened, scope);
    const updated = watchCalls(route.updated, scope);
    const closed = watchCalls(route.closed, scope);

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    return { scope, router, history, opened, updated, closed };
  }

  test('initial activation emits opened once, no updated', async () => {
    const { opened, updated, closed } = await setup();

    expect(opened).toHaveBeenCalledTimes(1);
    expect(updated).toHaveBeenCalledTimes(0);
    expect(closed).toHaveBeenCalledTimes(0);
  });

  test('a value-different param change emits updated (and re-emits opened)', async () => {
    const { scope, router, opened, updated } = await setup();

    await allSettled(router.navigate, {
      scope,
      params: { path: '/post/2' },
    });

    // Current behavior: a same-template path change is a fresh committed
    // activation, so `opened` fires again while `updated` additionally reports
    // the changed params. The double signal is pinned here deliberately; any
    // change to it is a separate contract decision, not part of the F3
    // readability refactor.
    expect(updated).toHaveBeenCalledTimes(1);
    expect(opened).toHaveBeenCalledTimes(2);
  });

  test('a query-only change is not a route update', async () => {
    const { scope, router, opened, updated } = await setup();

    await allSettled(router.navigate, {
      scope,
      params: { path: '/post/1', query: { ref: 'x' } },
    });

    expect(opened).toHaveBeenCalledTimes(1);
    expect(updated).toHaveBeenCalledTimes(0);
  });

  test('navigating away then back re-opens the route', async () => {
    const { scope, router, opened, closed } = await setup();

    await allSettled(router.navigate, { scope, params: { path: '/about' } });
    await allSettled(router.navigate, {
      scope,
      params: { path: '/post/1' },
    });

    expect(closed).toHaveBeenCalledTimes(1);
    expect(opened).toHaveBeenCalledTimes(2);
  });
});
