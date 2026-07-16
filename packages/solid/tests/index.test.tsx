import { allSettled, fork } from 'effector';
import { Provider } from 'effector-solid';
import { describe, expect, test, vi } from 'vitest';
import { render } from '@solidjs/testing-library';
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { createMemoryHistory } from 'history';

import {
  createLazyRouteView,
  createRouteView,
  createRoutesView,
  Link,
  RouterProvider,
  withLayout,
} from '../lib';

describe('solid bindings', () => {
  test('assigns one private layout group per withLayout call', () => {
    const view = createRouteView({ route: createRoute(), view: () => null });
    const Layout = (props: { children: JSX.Element }) => props.children;
    const first = withLayout(Layout, [view, view]);
    const second = withLayout(Layout, [view]);
    const symbol = Object.getOwnPropertySymbols(first[0])[0];

    expect(symbol).toBeDefined();
    expect(Reflect.get(first[0], symbol)).toBe(Reflect.get(first[1], symbol));
    expect(Reflect.get(first[0], symbol)).not.toBe(
      Reflect.get(second[0], symbol),
    );
  });

  test('lazy import starts on render and exposes Suspense fallback', async () => {
    let resolve!: (module: { default: () => JSX.Element }) => void;
    const route = createRoute({ path: '/lazy' });
    const importer = vi.fn(
      () =>
        new Promise<{ default: () => JSX.Element }>((done) => (resolve = done)),
    );
    const lazyView = createLazyRouteView({
      route,
      view: importer,
      fallback: () => <p id="lazy">loading</p>,
    });

    expect(importer).not.toHaveBeenCalled();

    const View = lazyView.view;
    const { container } = render(() => <View />);

    expect(importer).toHaveBeenCalledTimes(1);
    expect(container.querySelector('#lazy')?.textContent).toBe('loading');

    resolve({ default: () => <p id="lazy">loaded</p> });

    await vi.waitFor(() =>
      expect(container.querySelector('#lazy')?.textContent).toBe('loaded'),
    );
  });

  test('lazy route view accepts a router target without starting import', () => {
    const child = createRoute({ path: '/child' });
    const nestedRouter = createRouter({ routes: [child] });
    const importer = vi.fn(() =>
      Promise.resolve({ default: () => <p>nested</p> }),
    );

    const lazyView = createLazyRouteView({
      route: nestedRouter,
      view: importer,
    });

    expect(lazyView.route).toBe(nestedRouter);
    expect(importer).not.toHaveBeenCalled();
  });

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
          <Link to={route2} params={{ id: '42' }} query={{ tab: 'details' }}>
            open
          </Link>
        </RouterProvider>
      </Provider>
    ));

    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      '/faq/42?tab=details',
    );
  });

  test('link applies activeClass while its route is opened', async () => {
    const route = createRoute({ path: '/profile' });
    const scope = fork();
    const router = createRouter({ routes: [route] });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(createMemoryHistory()),
    });

    const { container } = render(() => (
      <Provider value={scope}>
        <RouterProvider router={router}>
          <Link to={route} activeClass="active">
            profile
          </Link>
        </RouterProvider>
      </Provider>
    ));

    expect(container.querySelector('a')?.className).toBe('');

    await allSettled(route.open, { scope, params: undefined });

    expect(container.querySelector('a')?.className).toBe('active');
  });

  test('lazy route view preserves nested route views', () => {
    const parentRoute = createRoute({ path: '/parent' });
    const childRoute = createRoute({ path: '/child', parent: parentRoute });
    const childView = createRouteView({
      route: childRoute,
      view: () => <p>child</p>,
    });

    const lazyView = createLazyRouteView({
      route: parentRoute,
      view: () => Promise.resolve({ default: () => <p>parent</p> }),
      children: [childView],
    });

    expect(lazyView.children).toEqual([childView]);
  });
});
