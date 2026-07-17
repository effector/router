// @vitest-environment happy-dom

import { allSettled, fork } from 'effector';
import { createBrowserHistory, createMemoryHistory } from 'history';
import { expect, test } from 'vitest';
import { z } from 'zod/v4';
import {
  createRoute,
  createRouter,
  createRouterControls,
  historyAdapter,
  trackQuery,
} from '../lib';

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

test('FSD controls ownership keeps route declarations independent from history', async () => {
  const controls = createRouterControls();
  const route = createRoute({ path: '/feature' });
  const router = createRouter({ routes: [route], controls });
  const scope = fork();

  await allSettled(controls.setHistory, {
    scope,
    params: historyAdapter(createMemoryHistory()),
  });
  await allSettled(route.open, { scope, params: {} });

  expect(scope.getState(route.$isOpened)).toBe(true);
  expect(scope.getState(router.$path)).toBe('/feature');
});

test('pathless routes and nested params remain executable examples', async () => {
  const modal = createRoute<{ open: boolean }>();
  const parent = createRoute({ path: '/users/:user' });
  const child = createRoute({ path: '/posts/:post', parent });
  const router = createRouter({ routes: [parent, child] });
  const scope = fork();

  await allSettled(modal.open, { scope, params: { params: { open: true } } });
  expect(scope.getState(modal.$isOpened)).toBe(true);

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(
      createMemoryHistory({ initialEntries: ['/users/u1/posts/p1'] }),
    ),
  });
  expect(scope.getState(child.$params)).toEqual({ user: 'u1', post: 'p1' });
});

test('notFound and standalone query tracking examples are executable', async () => {
  const controls = createRouterControls();
  const home = createRoute({ path: '/' });
  const notFound = createRoute();
  const router = createRouter({ routes: [home], controls, notFound });
  const scope = fork();
  const tracker = trackQuery({
    controls,
    routes: [home],
    parameters: z.object({ q: z.string() }),
  });

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(createMemoryHistory()),
  });
  await allSettled(router.navigate, {
    scope,
    params: { path: '/', query: { q: 'router' } },
  });
  expect(scope.getState(home.$isOpened)).toBe(true);

  await allSettled(router.navigate, {
    scope,
    params: { path: '/missing' },
  });
  expect(scope.getState(notFound.$isOpened)).toBe(true);
  expect(scope.getState(home.$isOpened)).toBe(false);
  expect(scope.getState(router.$query)).toEqual({ q: 'router' });
  expect(tracker).toHaveProperty('entered');
});
