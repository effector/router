import {
  allSettled,
  createEffect,
  createEvent,
  createStore,
  fork,
  sample,
} from 'effector';
import { Provider } from 'effector-react';
import {
  createRoutesView,
  createRouteView,
  createLazyRouteView,
  Link,
  RouterProvider,
  withLayout,
} from '../lib';
import { act, createRef, ReactNode, useEffect } from 'react';
import { describe, expect, test, vi } from 'vitest';
import {
  chainRoute,
  createRoute,
  createRouter,
  createVirtualRoute,
  historyAdapter,
} from '@effector/router';
import { createMemoryHistory } from 'history';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

describe('react bindings', () => {
  test('accepts a virtual route in a route view', () => {
    const route = createVirtualRoute();
    const routeView = createRouteView({ route, view: () => null });

    expect(routeView.route).toBe(route);
  });

  test('preserves nested views in a lazy route view (#70)', () => {
    const route = createRoute({ path: '/parent' });
    const child = createRouteView({
      route: createRoute({ path: '/child', parent: route }),
      view: () => null,
    });
    const lazyView = createLazyRouteView({
      route,
      view: () => Promise.resolve({ default: () => null }),
      children: [child],
    });

    expect(lazyView.children).toEqual([child]);
  });

  test('preserves nested views when applying a layout', () => {
    const route = createRoute({ path: '/parent' });
    const child = createRouteView({
      route: createRoute({ path: '/child', parent: route }),
      view: () => null,
    });
    const view = createRouteView({
      route,
      view: () => null,
      children: [child],
    });
    const [wrapped] = withLayout(({ children }) => <>{children}</>, [view]);

    expect(wrapped.children).toEqual([child]);
  });

  test('assigns one private layout group per withLayout call', () => {
    const view = createRouteView({ route: createRoute(), view: () => null });
    const Layout = ({ children }: { children: ReactNode }) => <>{children}</>;
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
    const { container } = render(
      <Provider value={scope}>
        <RoutesView />
      </Provider>,
    );

    await act(() => allSettled(first.open, { scope }));
    await act(() => allSettled(second.open, { scope }));

    expect(container.textContent).toBe('second');
  });

  test('lazy import starts on render and exposes Suspense fallback', async () => {
    let resolve!: (module: { default: () => ReactNode }) => void;
    const route = createRoute({ path: '/lazy' });
    const importer = vi.fn(
      () =>
        new Promise<{ default: () => ReactNode }>((done) => (resolve = done)),
    );
    const lazyView = createLazyRouteView({
      route,
      view: importer,
      fallback: () => <p data-testid="lazy">loading</p>,
    });

    expect(importer).not.toHaveBeenCalled();

    const View = lazyView.view;
    const { getByTestId } = render(<View />);

    expect(importer).toHaveBeenCalledTimes(1);
    expect(getByTestId('lazy').textContent).toBe('loading');

    resolve({ default: () => <p data-testid="lazy">loaded</p> });

    await waitFor(() => expect(getByTestId('lazy').textContent).toBe('loaded'));
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

  test('component changed when path changed', async () => {
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

    const { container } = render(
      <Provider value={scope}>
        <RouterProvider router={router}>
          <RoutesView />
        </RouterProvider>
      </Provider>,
    );

    await act(() => allSettled(route1.open, { scope, params: undefined }));

    expect(container.querySelector('#message')?.textContent).toBe('route1');

    await act(() => allSettled(route2.open, { scope, params: undefined }));

    expect(container.querySelector('#message')?.textContent).toBe('route2');

    act(() => history.push('/not-found'));
    await act(() => allSettled(scope));

    expect(container.querySelector('#message')?.textContent).toBe('not found');
  });

  test('link', async () => {
    const beforeOpen = vi.fn();
    const route1 = createRoute({ path: '/app' });
    const route2 = createRoute({
      path: '/faq/:id',
      beforeOpen: [createEffect(beforeOpen)],
    });

    const scope = fork();
    const router = createRouter({ routes: [route1, route2] });

    const history = createMemoryHistory();

    history.push('/app');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const RoutesView = createRoutesView({
      routes: [
        {
          route: route1,
          view: () => (
            <Link
              params={{ id: '123' }}
              query={{ tab: 'details' }}
              replace
              to={route2}
              id="link"
            >
              route1
            </Link>
          ),
        },
        {
          route: route2,
          view: () => (
            <Link to={route1} id="link">
              route2
            </Link>
          ),
        },
      ],
      otherwise: () => <p id="message">not found</p>,
    });

    const { container } = render(
      <Provider value={scope}>
        <RouterProvider router={router}>
          <RoutesView />
        </RouterProvider>
      </Provider>,
    );

    expect(container.querySelector('#link')?.getAttribute('href')).toBe(
      '/faq/123?tab=details',
    );

    await userEvent.click(container.querySelector('#link')!);

    await act(() => allSettled(scope));

    expect(scope.getState(route2.$isOpened)).toBeTruthy();
    expect(scope.getState(route2.$params)).toStrictEqual({ id: '123' });
    expect(beforeOpen).toHaveBeenCalledTimes(1);
    expect(history.index).toBe(1);

    await userEvent.click(container.querySelector('#link')!);

    await act(() => allSettled(scope));

    expect(scope.getState(route1.$isOpened)).toBeTruthy();
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
              <Link
                to={target}
                params={{ id: '42' }}
                query={{}}
                replace
                id="clear"
              />
            </>
          ),
        }),
      ],
    });
    const { container } = render(
      <Provider value={scope}>
        <RouterProvider router={router}>
          <RoutesView />
        </RouterProvider>
      </Provider>,
    );

    expect(container.querySelector('#preserve')?.getAttribute('href')).toBe(
      '/target/42?flag&keep=yes',
    );
    expect(container.querySelector('#replace')?.getAttribute('href')).toBe(
      '/target/42?flag&tab=details',
    );
    expect(container.querySelector('#clear')?.getAttribute('href')).toBe(
      '/target/42',
    );

    await act(() =>
      allSettled(target.open, {
        scope,
        params: { params: { id: '42' } },
      }),
    );
    expect(history.location.pathname + history.location.search).toBe(
      '/target/42?flag&keep=yes',
    );
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

    const { container } = render(
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
      </Provider>,
    );

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
    await act(() => allSettled(scope));

    expect(scope.getState(routes.primary.$isOpened)).toBe(true);
    expect(scope.getState(routes.middle.$isOpened)).toBe(false);
    expect(scope.getState(routes.modified.$isOpened)).toBe(false);
    expect(scope.getState(routes.blank.$isOpened)).toBe(false);
    expect(scope.getState(routes.download.$isOpened)).toBe(false);
    expect(scope.getState(routes.prevented.$isOpened)).toBe(false);
    expect(scope.getState(routes.external.$isOpened)).toBe(false);
  });

  test('forwards refs and native anchor attributes', async () => {
    const route = createRoute({ path: '/profile' });
    const scope = fork();
    const router = createRouter({ routes: [route] });
    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(createMemoryHistory()),
    });
    const ref = createRef<HTMLAnchorElement>();

    const { container } = render(
      <Provider value={scope}>
        <RouterProvider router={router}>
          <Link
            ref={ref}
            to={route}
            aria-label="Profile"
            data-testid="profile-link"
            rel="nofollow"
          />
        </RouterProvider>
      </Provider>,
    );

    expect(ref.current).toBe(container.querySelector('a'));
    expect(ref.current?.getAttribute('aria-label')).toBe('Profile');
    expect(ref.current?.dataset.testid).toBe('profile-link');
    expect(ref.current?.rel).toBe('nofollow');
  });

  test('chained route', async () => {
    interface User {
      id: number;
      name: string;
    }

    const authRoute = createRoute({ path: '/auth' });
    const profileRoute = createRoute({ path: '/profile' });

    const $user = createStore<User | null>({ id: 1, name: 'edward' });

    const authorizationCheckStarted = createEvent('check started');

    const authorized = createEvent('authorized');
    const rejected = createEvent('rejected');

    sample({
      clock: authorizationCheckStarted,
      source: $user,
      filter: Boolean,
      target: authorized,
    });

    sample({
      clock: authorizationCheckStarted,
      source: $user,
      filter: (user) => !user,
      target: rejected,
    });

    const chainedRoute = chainRoute({
      route: authRoute,
      beforeOpen: authorizationCheckStarted,
      openOn: rejected,
      cancelOn: authorized,
    });

    sample({
      clock: chainedRoute.cancelled,
      target: profileRoute.open,
    });

    const scope = fork();
    const router = createRouter({ routes: [authRoute, profileRoute] });

    const history = createMemoryHistory();

    history.push('/app');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const RoutesView = createRoutesView({
      routes: [
        {
          route: chainedRoute,
          view: () => <p data-testid="message">auth</p>,
        },
        {
          route: profileRoute,
          view: () => <p data-testid="message">profile</p>,
        },
      ],
      otherwise: () => <p data-testid="message">not found</p>,
    });

    const { getByTestId } = render(
      <Provider value={scope}>
        <RouterProvider router={router}>
          <RoutesView />
        </RouterProvider>
      </Provider>,
    );

    await act(() => allSettled(authRoute.open, { scope, params: undefined }));

    expect(getByTestId('message').textContent).toBe('profile');

    await act(async () => {
      await allSettled($user, { scope, params: null });
      await allSettled(authRoute.open, { scope, params: undefined });
    });

    expect(getByTestId('message').textContent).toBe('auth');
  });

  test('nested routes', async () => {
    const profileRoute = createRoute({ path: '/profile' });
    const friendsRoute = createRoute({
      path: '/friends',
      parent: profileRoute,
    });

    const scope = fork();
    const router = createRouter({ routes: [friendsRoute, profileRoute] });

    const history = createMemoryHistory();

    history.push('/app');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const RoutesView = createRoutesView({
      routes: [
        {
          route: friendsRoute,
          view: () => <p data-testid="message">friends</p>,
        },
        {
          route: profileRoute,
          view: () => <p data-testid="message">profile</p>,
        },
      ],
      otherwise: () => <p data-testid="message">not found</p>,
    });

    const { getByTestId } = render(
      <Provider value={scope}>
        <RouterProvider router={router}>
          <RoutesView />
        </RouterProvider>
      </Provider>,
    );

    await act(() =>
      allSettled(friendsRoute.open, { scope, params: undefined }),
    );

    expect(getByTestId('message').textContent).toBe('friends');

    await act(() =>
      allSettled(profileRoute.open, { scope, params: undefined }),
    );

    expect(getByTestId('message').textContent).toBe('profile');
  });

  test('with layout', async () => {
    const profileRoute = createRoute({ path: '/profile' });
    const friendsRoute = createRoute({
      path: '/friends',
      parent: profileRoute,
    });

    const authRoute = createRoute({ path: '/auth' });

    const scope = fork();
    const router = createRouter({
      routes: [friendsRoute, profileRoute, authRoute],
    });

    const history = createMemoryHistory();

    history.push('/auth');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    let layoutMounts = 0;
    let layoutUnmounts = 0;
    const ProfileLayout = (props: { children: ReactNode }) => {
      useEffect(() => {
        layoutMounts += 1;
        return () => {
          layoutUnmounts += 1;
        };
      }, []);

      return (
        <>
          <p data-testid="layout">layout!</p>
          {props.children}
        </>
      );
    };

    const RoutesView = createRoutesView({
      routes: [
        ...withLayout(ProfileLayout, [
          createRouteView({
            route: friendsRoute,
            view: () => <p data-testid="message">friends</p>,
          }),
          createRouteView({
            route: profileRoute,
            view: () => <p data-testid="message">profile</p>,
          }),
        ]),
        createRouteView({
          route: authRoute,
          view: () => <p data-testid="message">auth</p>,
        }),
      ],
      otherwise: () => <p data-testid="message">not found</p>,
    });

    const { getByTestId, queryByTestId } = render(
      <Provider value={scope}>
        <RouterProvider router={router}>
          <RoutesView />
        </RouterProvider>
      </Provider>,
    );

    await act(() =>
      allSettled(friendsRoute.open, { scope, params: undefined }),
    );

    expect(getByTestId('layout').textContent).toBe('layout!');
    expect(getByTestId('message').textContent).toBe('friends');
    expect(layoutMounts).toBe(1);

    await act(() =>
      allSettled(profileRoute.open, { scope, params: undefined }),
    );

    expect(getByTestId('layout').textContent).toBe('layout!');
    expect(getByTestId('message').textContent).toBe('profile');
    expect(layoutMounts).toBe(1);
    expect(layoutUnmounts).toBe(0);

    await act(() => allSettled(authRoute.open, { scope, params: undefined }));

    expect(queryByTestId('layout')).toBeFalsy();
    expect(getByTestId('message').textContent).toBe('auth');
    expect(layoutUnmounts).toBe(1);
  });
});
