import { allSettled, createEffect, fork } from 'effector';
import { createMemoryHistory } from 'history';
import { expect, test, vi } from 'vitest';

import { createRoute, createRouter, historyAdapter } from '../lib';

test('runs deprecated route preparation once per committed navigation', async () => {
  const prepareCall = vi.fn(() => undefined);
  const prepare = createEffect(prepareCall);
  const route = createRoute({
    path: '/profile',
    beforeOpen: [prepare],
  });
  const history = createMemoryHistory();
  const router = createRouter({ routes: [route] });
  const scope = fork();

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(history),
  });
  await allSettled(router.navigate, {
    scope,
    params: { path: '/profile' },
  });

  expect(scope.getState(route.$isOpened)).toBe(true);
  expect(scope.getState(route.$isPending)).toBe(false);
  expect(prepareCall).toHaveBeenCalledTimes(1);

  // A query-only location update is not a second route transition.
  history.push('/profile?tab=activity');
  await allSettled(scope);

  expect(scope.getState(route.$isOpened)).toBe(true);
  expect(prepareCall).toHaveBeenCalledTimes(1);
});
