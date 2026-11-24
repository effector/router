// The Vue port of packages/react/tests/nested-routers.test.tsx. The names and
// the steps of the cases are the same, so the two suites can be compared.
import { allSettled, fork } from 'effector';
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { flushPromises } from '@vue/test-utils';
import { createMemoryHistory } from 'history';
import { describe, expect, test } from 'vitest';
import { h } from 'vue';
import { createRoutesView } from '../lib';
import { mountRoutes, testIdQueries } from './helpers';

const message = (text: string) => () =>
  h('p', { 'data-testid': 'message' }, text);

describe('Nested Routers', () => {
  test('basic nested router functionality', async () => {
    const scope = fork();

    const shopRoutes = {
      products: createRoute({ path: '/products' }),
      cart: createRoute({ path: '/cart' }),
    };

    const shopRouter = createRouter({
      routes: [shopRoutes.products, shopRoutes.cart],
    });

    const mainRoutes = {
      home: createRoute({ path: '/' }),
      settings: createRoute({ path: '/settings' }),
    };

    const mainRouter = createRouter({
      routes: [mainRoutes.home, mainRoutes.settings, shopRouter],
    });

    const history = createMemoryHistory();
    history.push('/');

    await allSettled(mainRouter.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const ShopRoutesView = createRoutesView({
      routes: [
        {
          route: shopRoutes.products,
          view: message('products'),
        },
        {
          route: shopRoutes.cart,
          view: message('cart'),
        },
      ],
    });

    const MainRoutesView = createRoutesView({
      routes: [
        {
          route: mainRoutes.home,
          view: message('home'),
        },
        {
          route: mainRoutes.settings,
          view: message('settings'),
        },
        {
          route: shopRouter,
          view: ShopRoutesView,
        },
      ],
    });

    const { getByTestId } = testIdQueries(
      mountRoutes(mainRouter, scope, MainRoutesView),
    );

    expect(getByTestId('message').textContent).toBe('home');

    await allSettled(shopRoutes.products.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('products');
    expect(scope.getState(shopRoutes.products.$isOpened)).toBeTruthy();

    await allSettled(shopRoutes.cart.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('cart');
    expect(scope.getState(shopRoutes.cart.$isOpened)).toBeTruthy();

    await allSettled(mainRoutes.settings.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('settings');
    expect(scope.getState(mainRoutes.settings.$isOpened)).toBeTruthy();
  });

  test('multiple nested routers at same level', async () => {
    const scope = fork();

    const shopRoutes = {
      products: createRoute({ path: '/products' }),
      orders: createRoute({ path: '/orders' }),
    };

    const shopRouter = createRouter({
      routes: [shopRoutes.products, shopRoutes.orders],
    });

    const blogRoutes = {
      posts: createRoute({ path: '/posts' }),
      authors: createRoute({ path: '/authors' }),
    };

    const blogRouter = createRouter({
      routes: [blogRoutes.posts, blogRoutes.authors],
    });

    const mainRoutes = {
      home: createRoute({ path: '/' }),
    };

    const mainRouter = createRouter({
      routes: [mainRoutes.home, shopRouter, blogRouter],
    });

    const history = createMemoryHistory();
    history.push('/');

    await allSettled(mainRouter.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const ShopRoutesView = createRoutesView({
      routes: [
        {
          route: shopRoutes.products,
          view: message('Shop - Products'),
        },
        {
          route: shopRoutes.orders,
          view: message('Shop - Orders'),
        },
      ],
    });

    const BlogRoutesView = createRoutesView({
      routes: [
        {
          route: blogRoutes.posts,
          view: message('Blog - Posts'),
        },
        {
          route: blogRoutes.authors,
          view: message('Blog - Authors'),
        },
      ],
    });

    const MainRoutesView = createRoutesView({
      routes: [
        {
          route: mainRoutes.home,
          view: message('Home'),
        },
        {
          route: shopRouter,
          view: ShopRoutesView,
        },
        {
          route: blogRouter,
          view: BlogRoutesView,
        },
      ],
    });

    const { getByTestId } = testIdQueries(
      mountRoutes(mainRouter, scope, MainRoutesView),
    );

    expect(getByTestId('message').textContent).toBe('Home');

    await allSettled(shopRoutes.products.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('Shop - Products');

    await allSettled(blogRoutes.posts.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('Blog - Posts');

    await allSettled(shopRoutes.orders.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('Shop - Orders');

    await allSettled(blogRoutes.authors.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('Blog - Authors');
  });

  test('nested router state isolation', async () => {
    const scope = fork();

    const moduleARoute = createRoute({ path: '/module-a' });
    const moduleBRoute = createRoute({ path: '/module-b' });

    const mainRouter = createRouter({
      routes: [moduleARoute, moduleBRoute],
    });

    const history = createMemoryHistory();
    history.push('/');

    await allSettled(mainRouter.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const MainRoutesView = createRoutesView({
      routes: [
        {
          route: moduleARoute,
          view: message('Module A'),
        },
        {
          route: moduleBRoute,
          view: message('Module B'),
        },
      ],
    });

    const { getByTestId, queryByTestId } = testIdQueries(
      mountRoutes(mainRouter, scope, MainRoutesView),
    );

    expect(queryByTestId('message')).toBeFalsy();

    await allSettled(moduleARoute.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('Module A');

    expect(scope.getState(moduleARoute.$isOpened)).toBeTruthy();
    expect(scope.getState(moduleBRoute.$isOpened)).toBeFalsy();

    await allSettled(moduleBRoute.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('Module B');

    expect(scope.getState(moduleARoute.$isOpened)).toBeFalsy();
    expect(scope.getState(moduleBRoute.$isOpened)).toBeTruthy();
  });

  test('nested router with route parameters', async () => {
    const scope = fork();

    const projectRoutes = {
      details: createRoute({ path: '/details' }),
      tasks: createRoute({ path: '/tasks/:taskId' }),
    };

    const projectRouter = createRouter({
      routes: [projectRoutes.details, projectRoutes.tasks],
    });

    const mainRoutes = {
      workspace: createRoute({ path: '/workspace/:workspaceId' }),
    };

    const mainRouter = createRouter({
      routes: [mainRoutes.workspace, projectRouter],
    });

    const history = createMemoryHistory();
    history.push('/workspace/ws-123');

    await allSettled(mainRouter.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const ProjectRoutesView = createRoutesView({
      routes: [
        {
          route: projectRoutes.details,
          view: message('Project Details'),
        },
        {
          route: projectRoutes.tasks,
          view: message('Task View'),
        },
      ],
    });

    const MainRoutesView = createRoutesView({
      routes: [
        {
          route: mainRoutes.workspace,
          view: message('Workspace'),
        },
        {
          route: projectRouter,
          view: ProjectRoutesView,
        },
      ],
    });

    const { getByTestId } = testIdQueries(
      mountRoutes(mainRouter, scope, MainRoutesView),
    );

    expect(getByTestId('message').textContent).toBe('Workspace');
    expect(scope.getState(mainRoutes.workspace.$params)).toEqual({
      workspaceId: 'ws-123',
    });

    await allSettled(projectRoutes.tasks.open, {
      scope,
      params: { params: { taskId: 'task-456' } },
    });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('Task View');

    expect(scope.getState(projectRoutes.tasks.$params)).toEqual({
      taskId: 'task-456',
    });

    await allSettled(projectRoutes.details.open, {
      scope,
      params: undefined,
    });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('Project Details');
  });

  test('nested router isolated state management', async () => {
    const scope = fork();

    const moduleARoutes = {
      page1: createRoute({ path: '/module-a/page1' }),
      page2: createRoute({ path: '/module-a/page2' }),
    };

    const moduleARouter = createRouter({
      routes: [moduleARoutes.page1, moduleARoutes.page2],
    });

    const moduleBRoutes = {
      page1: createRoute({ path: '/module-b/page1' }),
      page2: createRoute({ path: '/module-b/page2' }),
    };

    const moduleBRouter = createRouter({
      routes: [moduleBRoutes.page1, moduleBRoutes.page2],
    });

    const mainRouter = createRouter({
      routes: [moduleARouter, moduleBRouter],
    });

    const history = createMemoryHistory();
    history.push('/');

    await allSettled(mainRouter.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const ModuleARoutesView = createRoutesView({
      routes: [
        {
          route: moduleARoutes.page1,
          view: message('Module A - Page 1'),
        },
        {
          route: moduleARoutes.page2,
          view: message('Module A - Page 2'),
        },
      ],
    });

    const ModuleBRoutesView = createRoutesView({
      routes: [
        {
          route: moduleBRoutes.page1,
          view: message('Module B - Page 1'),
        },
        {
          route: moduleBRoutes.page2,
          view: message('Module B - Page 2'),
        },
      ],
    });

    const MainRoutesView = createRoutesView({
      routes: [
        {
          route: moduleARouter,
          view: ModuleARoutesView,
        },
        {
          route: moduleBRouter,
          view: ModuleBRoutesView,
        },
      ],
    });

    const { getByTestId } = testIdQueries(
      mountRoutes(mainRouter, scope, MainRoutesView),
    );

    await allSettled(moduleARoutes.page1.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('Module A - Page 1');

    expect(scope.getState(moduleARoutes.page1.$isOpened)).toBeTruthy();
    expect(scope.getState(moduleBRoutes.page1.$isOpened)).toBeFalsy();

    await allSettled(moduleBRoutes.page1.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('Module B - Page 1');

    expect(scope.getState(moduleARoutes.page1.$isOpened)).toBeFalsy();
    expect(scope.getState(moduleBRoutes.page1.$isOpened)).toBeTruthy();

    await allSettled(moduleARoutes.page2.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('message').textContent).toBe('Module A - Page 2');

    expect(scope.getState(moduleARoutes.page2.$isOpened)).toBeTruthy();
    expect(scope.getState(moduleBRoutes.page1.$isOpened)).toBeFalsy();
  });
});
