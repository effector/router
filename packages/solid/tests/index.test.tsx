import { allSettled, fork } from 'effector';
import { Provider } from 'effector-solid';
import { describe, expect, test } from 'vitest';
import { render } from '@solidjs/testing-library';
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { createMemoryHistory } from 'history';

import { createRoutesView, Link, RouterProvider } from '../lib';

describe('solid bindings', () => {
  test('component changes when path changes', async () => {
    const route1 = createRoute({ path: '/app' });
    const route2 = createRoute({ path: '/faq' });

    const scope = fork();
    const router = createRouter({ routes: [route1, route2] });

    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const RoutesView = createRoutesView({
      routes: [
        { route: route1, view: () => <p id="message">route1</p> },
        { route: route2, view: () => <p id="message">route2</p> },
      ],
      otherwise: () => <p id="message">not found</p>,
    });

    const { container } = render(() => (
      <Provider value={scope}>
        <RouterProvider router={router}>
          <RoutesView />
        </RouterProvider>
      </Provider>
    ));

    await allSettled(route1.open, { scope, params: undefined });
    expect(container.querySelector('#message')?.textContent).toBe('route1');

    await allSettled(route2.open, { scope, params: undefined });
    expect(container.querySelector('#message')?.textContent).toBe('route2');

    history.push('/not-found');
    await allSettled(scope);
    expect(container.querySelector('#message')?.textContent).toBe('not found');
  });

  test('link renders resolved href', async () => {
    const route1 = createRoute({ path: '/app' });
    const route2 = createRoute({ path: '/faq/:id' });

    const scope = fork();
    const router = createRouter({ routes: [route1, route2] });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(createMemoryHistory()),
    });

    const { container } = render(() => (
      <Provider value={scope}>
        <RouterProvider router={router}>
          <Link to={route2} params={{ id: '42' }}>
            open
          </Link>
        </RouterProvider>
      </Provider>
    ));

    expect(container.querySelector('a')?.getAttribute('href')).toBe('/faq/42');
  });
});
