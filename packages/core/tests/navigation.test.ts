import { allSettled, createEvent, createStore, fork, sample } from 'effector';
import { createMemoryHistory } from 'history';
import { describe, expect, test, vi } from 'vitest';

import {
  beforeNavigate,
  createRoute,
  createRouter,
  createRouterControls,
  historyAdapter,
  queryAdapter,
  redirect,
} from '../lib';
import { watchCalls } from './utils';

function createFixture(initialEntries = ['/']) {
  const controls = createRouterControls();
  const routes = {
    home: createRoute({ path: '/' }),
    protected: createRoute({ path: '/protected' }),
    signIn: createRoute({ path: '/sign-in' }),
  };
  const router = createRouter({ routes: Object.values(routes), controls });
  const history = createMemoryHistory({ initialEntries });

  return { controls, routes, router, history };
}

describe('navigation operators', () => {
  test('publishes initialized once per setHistory and normalized updates only', async () => {
    const scope = fork();
    const router = createRouter({ routes: [] });
    const first = createMemoryHistory({ initialEntries: ['/one?tab=first'] });
    const second = createMemoryHistory({ initialEntries: ['/two?tab=second'] });
    const initialized = vi.fn();
    const updated = vi.fn();

    router.initialized.watch(initialized);
    router.updated.watch(updated);

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(first),
    });
    expect(initialized).toHaveBeenCalledWith({
      path: '/one',
      query: { tab: 'first' },
    });
    expect(updated).not.toHaveBeenCalled();

    first.push('/one?tab=second');
    await allSettled(scope);
    expect(updated).toHaveBeenCalledTimes(1);
    expect(updated).toHaveBeenLastCalledWith({
      path: '/one',
      query: { tab: 'second' },
    });

    first.push('/one?tab=second#hash-only');
    await allSettled(scope);
    first.push('/one?tab=second');
    await allSettled(scope);
    expect(updated).toHaveBeenCalledTimes(1);

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(second),
    });
    expect(initialized).toHaveBeenCalledTimes(2);
    expect(initialized).toHaveBeenLastCalledWith({
      path: '/two',
      query: { tab: 'second' },
    });
    expect(updated).toHaveBeenCalledTimes(1);
  });

  test('keeps lifecycle state isolated per Fork and detaches stale native listeners', async () => {
    const router = createRouter({ routes: [] });
    const history = createMemoryHistory({ initialEntries: ['/one', '/two'] });
    const replacement = createMemoryHistory({
      initialEntries: ['/replacement'],
    });
    const scopeA = fork();
    const scopeB = fork();

    await allSettled(router.setHistory, {
      scope: scopeA,
      params: historyAdapter(history),
    });
    expect(scopeA.getState(router.$path)).toBe('/two');
    expect(scopeB.getState(router.$path)).toBeNull();

    history.back();
    await allSettled(scopeA);
    expect(scopeA.getState(router.$path)).toBe('/one');
    expect(scopeB.getState(router.$path)).toBeNull();

    await allSettled(router.setHistory, {
      scope: scopeA,
      params: historyAdapter(replacement),
    });
    history.push('/stale');
    await allSettled(scopeA);
    expect(scopeA.getState(router.$path)).toBe('/replacement');
  });

  test('reports pre-init navigation failures without creating attempts', async () => {
    const scope = fork();
    const route = createRoute({ path: '/protected' });
    const router = createRouter({ routes: [route] });
    const history = createMemoryHistory({ initialEntries: ['/'] });
    const failures = vi.fn();

    router.navigationFailed.watch(failures);

    await allSettled(router.navigate, {
      scope,
      params: { path: '/protected' },
    });
    await allSettled(router.back, { scope });
    await allSettled(router.forward, { scope });
    await allSettled(route.open as any, { scope });
    await allSettled(createRoute().open as any, { scope });

    expect(failures.mock.calls).toEqual([
      [
        {
          operation: 'navigate',
          reason: 'not-initialized',
          payload: { path: '/protected' },
        },
      ],
      [{ operation: 'back', reason: 'not-initialized' }],
      [{ operation: 'forward', reason: 'not-initialized' }],
      [
        {
          operation: 'navigate',
          reason: 'not-initialized',
          payload: { path: '/protected', query: {} },
        },
      ],
    ]);
    expect(history.location.pathname).toBe('/');
    expect(scope.getState(route.$isOpened)).toBe(false);
  });

  test('navigate path does not require query and preserves current query', async () => {
    const { controls, router, history } = createFixture(['/?keep=yes']);
    const scope = fork();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    await allSettled(controls.navigate, {
      scope,
      params: { path: '/sign-in' },
    });

    expect(history.location.pathname).toBe('/sign-in');
    expect(history.location.search).toBe('?keep=yes');
  });

  test('beforeNavigate holds and proceeds a matching transition', async () => {
    const { controls, routes, router, history } = createFixture();
    const transition = beforeNavigate({ controls, to: routes.protected });
    const scope = fork();
    const started = watchCalls(transition.started, scope);

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    await allSettled(routes.protected.open, { scope, params: {} });

    expect(started).toHaveBeenCalledTimes(1);
    expect(history.location.pathname).toBe('/');

    await allSettled(transition.proceed, { scope });

    expect(history.location.pathname).toBe('/protected');
    expect(scope.getState(routes.protected.$isOpened)).toBe(true);
  });

  test('beforeNavigate cancels without changing history', async () => {
    const { controls, routes, router, history } = createFixture();
    const transition = beforeNavigate({ controls, to: routes.protected });
    const scope = fork();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    await allSettled(routes.protected.open, { scope, params: {} });
    await allSettled(transition.cancel, { scope });

    expect(history.location.pathname).toBe('/');
    expect(scope.getState(routes.protected.$isOpened)).toBe(false);
  });

  test('store filter is composed before beforeNavigate', async () => {
    const { controls, routes, router, history } = createFixture();
    const $dirty = createStore(false);
    const transition = beforeNavigate({
      controls,
      from: routes.home,
      to: routes.protected,
      filter: $dirty,
    });
    const scope = fork();
    const started = watchCalls(transition.started, scope);

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    await allSettled(routes.protected.open, { scope, params: {} });

    expect(started).not.toHaveBeenCalled();
    expect(history.location.pathname).toBe('/protected');
  });

  test('function filter composes with route arrays', async () => {
    const { controls, routes, router, history } = createFixture();
    const transition = beforeNavigate({
      controls,
      from: [routes.home, routes.protected],
      to: [routes.protected, routes.signIn],
      filter: ({ path }) => path === '/sign-in',
    });
    const scope = fork();
    const started = watchCalls(transition.started, scope);

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    await allSettled(routes.protected.open, { scope, params: {} });

    expect(started).not.toHaveBeenCalled();
    expect(history.location.pathname).toBe('/protected');

    await allSettled(routes.signIn.open, { scope, params: {} });

    expect(started).toHaveBeenCalledTimes(1);
    expect(history.location.pathname).toBe('/protected');

    await allSettled(transition.proceed, { scope });

    expect(history.location.pathname).toBe('/sign-in');
  });

  test('all matching operators must proceed', async () => {
    const { controls, routes, router, history } = createFixture();
    const first = beforeNavigate({ controls, to: routes.protected });
    const second = beforeNavigate({ controls, to: routes.protected });
    const scope = fork();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    await allSettled(routes.protected.open, { scope, params: {} });
    await allSettled(first.proceed, { scope });

    expect(history.location.pathname).toBe('/');

    await allSettled(second.proceed, { scope });

    expect(history.location.pathname).toBe('/protected');
  });

  test('ordinary navigation is ignored while a transition is held', async () => {
    const { controls, routes, router, history } = createFixture();
    const transition = beforeNavigate({ controls, to: routes.protected });
    const scope = fork();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    await allSettled(routes.protected.open, { scope, params: {} });
    await allSettled(routes.signIn.open, { scope, params: {} });

    expect(history.location.pathname).toBe('/');

    await allSettled(transition.proceed, { scope });

    expect(history.location.pathname).toBe('/protected');
  });

  test('redirect supersedes a held transition', async () => {
    const { controls, routes, router, history } = createFixture();
    const authorization = beforeNavigate({
      controls,
      to: routes.protected,
    });

    sample({
      clock: authorization.started,
      target: redirect({ to: routes.signIn, replace: true }),
    });

    const scope = fork();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    await allSettled(routes.protected.open, { scope, params: {} });

    expect(history.location.pathname).toBe('/sign-in');
    expect(history.action).toBe('REPLACE');
    expect(history.index).toBe(0);
    expect(scope.getState(routes.signIn.$isOpened)).toBe(true);
    expect(scope.getState(routes.protected.$isOpened)).toBe(false);
  });

  test('redirect receives dynamic route payload from sample', async () => {
    const controls = createRouterControls();
    const user = createRoute({ path: '/users/:id' });
    const router = createRouter({ routes: [user], controls });
    const history = createMemoryHistory();
    const requested = createEvent<string>();

    sample({
      clock: requested,
      fn: (id) => ({ params: { id }, query: { source: 'test' } }),
      target: redirect({ to: user }),
    });

    const scope = fork();
    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });
    await allSettled(requested, { scope, params: '42' });

    expect(history.location.pathname).toBe('/users/42');
    expect(history.location.search).toBe('?source=test');
  });

  test('redirect loops are bounded and leave history unchanged', async () => {
    const controls = createRouterControls();
    const first = createRoute({ path: '/first' });
    const second = createRoute({ path: '/second' });
    const afterLoop = createRoute({ path: '/after-loop' });
    const router = createRouter({
      routes: [first, second, afterLoop],
      controls,
    });
    const history = createMemoryHistory();
    const fromFirst = beforeNavigate({ controls, to: first });
    const fromSecond = beforeNavigate({ controls, to: second });

    sample({ clock: fromFirst.started, target: redirect({ to: second }) });
    sample({ clock: fromSecond.started, target: redirect({ to: first }) });

    const report = vi.spyOn(console, 'error').mockImplementation(() => {});
    const scope = fork();

    try {
      await allSettled(router.setHistory, {
        scope,
        params: historyAdapter(history),
      });
      await allSettled(first.open, { scope, params: {} });

      expect(report.mock.calls).toEqual([
        [
          '[@effector/router] Redirect cancelled after 16 consecutive redirects',
        ],
      ]);
      expect(history.location.pathname).toBe('/');
      expect(scope.getState(first.$isOpened)).toBe(false);
      expect(scope.getState(second.$isOpened)).toBe(false);

      await allSettled(afterLoop.open, { scope, params: {} });

      expect(history.location.pathname).toBe('/after-loop');
    } finally {
      report.mockRestore();
    }
  });

  test('queryAdapter holds navigation until proceed', async () => {
    const { controls, routes, router } = createFixture();
    const transition = beforeNavigate({ controls, to: routes.protected });
    const history = createMemoryHistory({ initialEntries: ['/host'] });
    const scope = fork();

    await allSettled(router.setHistory, {
      scope,
      params: queryAdapter(history, { key: 'route' }),
    });
    await allSettled(routes.protected.open, { scope, params: {} });

    expect(
      new URLSearchParams(history.location.search).get('route'),
    ).toBeNull();

    await allSettled(transition.proceed, { scope });

    expect(new URLSearchParams(history.location.search).get('route')).toBe(
      '/protected',
    );
    expect(scope.getState(routes.protected.$isOpened)).toBe(true);
  });

  test('historyAdapter holds native POP until proceed', async () => {
    const { controls, routes, router, history } = createFixture([
      '/',
      '/protected',
    ]);
    const transition = beforeNavigate({
      controls,
      from: routes.protected,
      to: routes.home,
    });
    const scope = fork();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    history.back();
    await allSettled(scope);

    expect(history.location.pathname).toBe('/protected');

    await allSettled(transition.proceed, { scope });

    expect(history.location.pathname).toBe('/');
  });

  test('historyAdapter keeps native POP cancelled', async () => {
    const { controls, routes, router, history } = createFixture([
      '/',
      '/protected',
    ]);
    const transition = beforeNavigate({
      controls,
      from: routes.protected,
      to: routes.home,
    });
    const scope = fork();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    history.back();
    await allSettled(scope);
    await allSettled(transition.cancel, { scope });

    expect(history.location.pathname).toBe('/protected');
    expect(history.index).toBe(1);
    expect(scope.getState(routes.protected.$isOpened)).toBe(true);
  });
});
