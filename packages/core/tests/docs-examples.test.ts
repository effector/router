// @vitest-environment happy-dom

import { allSettled, fork } from 'effector';
import { createBrowserHistory } from 'history';
import { expect, test } from 'vitest';
import { createRoute, createRouter, historyAdapter } from '../lib';

test('getting-started history initialization example', async () => {
  const homeRoute = createRoute({ path: '/' });
  const router = createRouter({ routes: [homeRoute] });
  const scope = fork();

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(createBrowserHistory()),
  });

  expect(scope.getState(homeRoute.$isOpened)).toBe(true);
});
