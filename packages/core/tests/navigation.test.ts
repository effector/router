import { allSettled, createEvent, createStore, fork, sample } from 'effector';
import { createMemoryHistory } from 'history';
import { describe, expect, test } from 'vitest';

import {
  beforeNavigate,
  createRoute,
  createRouter,
  createRouterControls,
  historyAdapter,
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
});
