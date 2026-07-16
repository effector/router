import { allSettled, fork } from 'effector';
import { Provider } from 'effector-solid';
import { createSignal, onCleanup, onMount } from 'solid-js';
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render } from '@solidjs/testing-library';
import {
  createRoute,
  createRouter,
  createVirtualRoute,
  historyAdapter,
} from '@effector/router';
import { createMemoryHistory } from 'history';

import {
  createLazyRouteView,
  createRouteView,
  createRoutesView,
  Link,
  Outlet,
  RouterProvider,
  useLink,
  withLayout,
} from '../lib';
import type { QueryInput } from '@effector/router';

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

  test('selects the last declared active sibling', async () => {
    const first = createVirtualRoute();
    const second = createVirtualRoute();
    const scope = fork();
    const RoutesView = createRoutesView({
      routes: [
        createRouteView({ route: first, view: () => <p>first</p> }),
        createRouteView({ route: second, view: () => <p>second</p> }),
      ],
    });
    const { container } = render(() => (
      <Provider value={scope}>
        <RoutesView />
      </Provider>
    ));

    await allSettled(first.open, { scope, params: {} });
    await allSettled(second.open, { scope, params: {} });

    expect(container.textContent).toBe('second');
  });

  test('keeps a grouped layout mounted while sibling pages switch', async () => {
    const first = createVirtualRoute();
    const second = createVirtualRoute();
    const outside = createVirtualRoute();
    const scope = fork();
    let mounts = 0;
    let unmounts = 0;
    const Layout = (props: { children: JSX.Element }) => {
      onMount(() => {
        mounts += 1;
      });
      onCleanup(() => {
        unmounts += 1;
      });
      return <section>{props.children}</section>;
    };
    const RoutesView = createRoutesView({
      routes: [
        ...withLayout(Layout, [
          createRouteView({ route: first, view: () => <p>first</p> }),
          createRouteView({ route: second, view: () => <p>second</p> }),
        ]),
        createRouteView({ route: outside, view: () => <p>outside</p> }),
      ],
    });
    const { container } = render(() => (
      <Provider value={scope}>
        <RoutesView />
      </Provider>
    ));

    await allSettled(first.open, { scope });
    await allSettled(second.open, { scope });
    expect(container.textContent).toBe('second');
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);

    await allSettled(outside.open, { scope });
    expect(container.textContent).toBe('outside');
    expect(unmounts).toBe(1);
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

  test('href and route.open share effective query semantics', async () => {
    const source = createRoute({ path: '/source' });
    const target = createRoute({ path: '/target/:id' });
    const scope = fork();
    const router = createRouter({ routes: [source, target] });
    const history = createMemoryHistory({
      initialEntries: ['/source?keep=yes&flag'],
    });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const RoutesView = createRoutesView({
      routes: [
        createRouteView({
          route: source,
          view: () => (
            <>
              <Link to={target} params={{ id: '42' }} id="preserve" />
              <Link
                to={target}
                params={{ id: '42' }}
                query={{ tab: 'details', flag: null }}
                id="replace"
              />
            </>
          ),
        }),
      ],
    });
    const { container } = render(() => (
      <Provider value={scope}>
        <RouterProvider router={router}>
          <RoutesView />
        </RouterProvider>
      </Provider>
    ));

    expect(container.querySelector('#preserve')?.getAttribute('href')).toBe(
      '/target/42?flag&keep=yes',
    );
    expect(container.querySelector('#replace')?.getAttribute('href')).toBe(
      '/target/42?flag&tab=details',
    );

    await allSettled(target.open, {
      scope,
      params: { params: { id: '42' } },
    });
    expect(history.location.pathname + history.location.search).toBe(
      '/target/42?flag&keep=yes',
    );
  });

  test('useLink exposes reactive params/query and opens directly', async () => {
    const target = createRoute({ path: '/target/:id' });
    const scope = fork();
    const router = createRouter({ routes: [target] });
    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(createMemoryHistory()),
    });
    const [params, setParams] = createSignal({ id: 'one' });
    const [query, setQuery] = createSignal<QueryInput>({ tab: 'first' });

    const DirectLink = () => {
      const link = useLink(target, params, query);
      return (
        <>
          <a id="direct" href={link.path()} />
          <button
            id="open-direct"
            onClick={() => link.onOpen({ params: params(), query: query() })}
          />
        </>
      );
    };
    const { container } = render(() => (
      <Provider value={scope}>
        <RouterProvider router={router}>
          <DirectLink />
        </RouterProvider>
      </Provider>
    ));

    expect(container.querySelector('#direct')?.getAttribute('href')).toBe(
      '/target/one?tab=first',
    );
    setParams({ id: 'two' });
    setQuery({ tab: 'second' });
    await vi.waitFor(() =>
      expect(container.querySelector('#direct')?.getAttribute('href')).toBe(
        '/target/two?tab=second',
      ),
    );

    container.querySelector<HTMLButtonElement>('#open-direct')!.click();
    await allSettled(scope);
    expect(scope.getState(target.$isOpened)).toBe(true);
    expect(scope.getState(target.$params)).toStrictEqual({ id: 'two' });
  });

  test('preserves native behavior for non-navigation clicks', async () => {
    const routes = {
      primary: createRoute({ path: '/primary' }),
      middle: createRoute({ path: '/middle' }),
      modified: createRoute({ path: '/modified' }),
      blank: createRoute({ path: '/blank' }),
      download: createRoute({ path: '/download' }),
      prevented: createRoute({ path: '/prevented' }),
      external: createRoute({ path: '/external' }),
    };
    const scope = fork();
    const router = createRouter({ routes: Object.values(routes) });
    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(createMemoryHistory()),
    });

    const { container } = render(() => (
      <Provider value={scope}>
        <RouterProvider router={router}>
          <>
            <Link to={routes.primary} id="primary" />
            <Link to={routes.middle} id="middle" />
            <Link to={routes.modified} id="modified" />
            <Link to={routes.blank} id="blank" target="_blank" />
            <Link to={routes.download} id="download" download="file" />
            <Link
              to={routes.prevented}
              id="prevented"
              onClick={(event) => event.preventDefault()}
            />
            <Link to={routes.external} id="external" />
          </>
        </RouterProvider>
      </Provider>
    ));

    container
      .querySelector<HTMLAnchorElement>('#external')!
      .setAttribute('href', 'https://example.com/external');
    container
      .querySelector<HTMLAnchorElement>('#blank')!
      .addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(container.querySelector('#middle')!, { button: 1 });
    fireEvent.click(container.querySelector('#modified')!, { metaKey: true });
    fireEvent.click(container.querySelector('#blank')!);
    fireEvent.click(container.querySelector('#download')!);
    fireEvent.click(container.querySelector('#prevented')!);
    fireEvent.click(container.querySelector('#external')!);
    fireEvent.click(container.querySelector('#primary')!);
    await allSettled(scope);

    expect(scope.getState(routes.primary.$isOpened)).toBe(true);
    expect(scope.getState(routes.middle.$isOpened)).toBe(false);
    expect(scope.getState(routes.modified.$isOpened)).toBe(false);
    expect(scope.getState(routes.blank.$isOpened)).toBe(false);
    expect(scope.getState(routes.download.$isOpened)).toBe(false);
    expect(scope.getState(routes.prevented.$isOpened)).toBe(false);
    expect(scope.getState(routes.external.$isOpened)).toBe(false);
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

  test('provides recursive outlet context through three levels', async () => {
    const rootRoute = createRoute({ path: '/root' });
    const childRoute = createRoute({ path: '/child', parent: rootRoute });
    const leafRoute = createRoute({ path: '/leaf', parent: childRoute });
    const scope = fork();
    const router = createRouter({
      routes: [rootRoute, childRoute, leafRoute],
    });
    const history = createMemoryHistory({
      initialEntries: ['/root/child/leaf'],
    });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const RoutesView = createRoutesView({
      routes: [
        createRouteView({
          route: rootRoute,
          view: () => (
            <div data-testid="root">
              root
              <Outlet />
            </div>
          ),
          children: [
            createRouteView({
              route: childRoute,
              view: () => (
                <div data-testid="child">
                  child
                  <Outlet />
                </div>
              ),
              children: [
                createRouteView({
                  route: leafRoute,
                  view: () => <span data-testid="leaf">leaf</span>,
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const { container } = render(() => (
      <Provider value={scope}>
        <RouterProvider router={router}>
          <RoutesView />
        </RouterProvider>
      </Provider>
    ));

    expect(container.querySelector('[data-testid="root"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="child"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="leaf"]')).toBeTruthy();
  });

  test('delegates a Router target to its nested renderer', async () => {
    const parentRoute = createRoute({ path: '/profile' });
    const childRoute = createRoute({ path: '/child', parent: parentRoute });
    const nestedRouter = createRouter({ routes: [childRoute] });
    const router = createRouter({ routes: [parentRoute, nestedRouter] });
    const scope = fork();
    const history = createMemoryHistory({ initialEntries: ['/profile'] });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const NestedRoutesView = createRoutesView({
      routes: [
        createRouteView({ route: childRoute, view: () => <p>child</p> }),
      ],
    });
    const RoutesView = createRoutesView({
      routes: [
        createRouteView({
          route: parentRoute,
          view: () => (
            <div>
              parent
              <Outlet />
            </div>
          ),
          children: [
            createRouteView({ route: nestedRouter, view: NestedRoutesView }),
          ],
        }),
      ],
    });
    const { container } = render(() => (
      <Provider value={scope}>
        <RouterProvider router={router}>
          <RoutesView />
        </RouterProvider>
      </Provider>
    ));

    await allSettled(childRoute.open, { scope, params: undefined });
    expect(container.textContent).toContain('child');
  });
});
