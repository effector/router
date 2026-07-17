import { allSettled, fork, type Scope } from 'effector';
import { describe, expect, test, vi } from 'vitest';
import {
  createRoute,
  createRouter,
  historyAdapter,
  type Router,
} from '@effector/router';
import { createMemoryHistory } from 'history';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, onMounted, onUnmounted, type Plugin } from 'vue';
import { createRequire } from 'node:module';
import {
  createLazyRouteView,
  createRouteView,
  createRoutesView,
  Link,
  Outlet,
  RouterProvider,
  withLayout,
} from '../lib';

// effector-vue@23.1.1's native ESM entry imports a Vue 2-style default export,
// which Vitest cannot load with Vue 3. The package's CJS entry exposes the same
// public factory and lets this test exercise the documented plugin setup.
const { EffectorScopePlugin } = createRequire(import.meta.url)(
  'effector-vue',
) as {
  EffectorScopePlugin: (config: { scope: Scope }) => Plugin;
};

function mountRoutes(
  router: Router,
  scope: Scope,
  RoutesView: ReturnType<typeof createRoutesView>,
) {
  return mount(RouterProvider, {
    props: { router },
    slots: { default: () => h(RoutesView) },
    global: {
      plugins: [EffectorScopePlugin({ scope })],
    },
  });
}

describe('vue bindings', () => {
  test('assigns one private layout group per withLayout call', () => {
    const view = createRouteView({
      route: createRoute(),
      view: defineComponent({ render: () => null }),
    });
    const Layout = defineComponent({ render: () => null });
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
    const first = createRoute();
    const second = createRoute();
    const scope = fork();
    const router = createRouter({ routes: [] });
    const RoutesView = createRoutesView({
      routes: [
        createRouteView({
          route: first,
          view: { render: () => h('p', 'first') },
        }),
        createRouteView({
          route: second,
          view: { render: () => h('p', 'second') },
        }),
      ],
    });
    const wrapper = mountRoutes(router, scope, RoutesView);

    await allSettled(first.open, { scope, params: undefined });
    await allSettled(second.open, { scope, params: undefined });
    await flushPromises();

    expect(wrapper.text()).toBe('second');
  });

  test('keeps a grouped layout mounted while sibling pages switch', async () => {
    const first = createRoute();
    const second = createRoute();
    const outside = createRoute();
    const scope = fork();
    let mounts = 0;
    let unmounts = 0;
    const Layout = defineComponent({
      setup(_, { slots }) {
        onMounted(() => {
          mounts += 1;
        });
        onUnmounted(() => {
          unmounts += 1;
        });
        return () => h('section', slots.default?.());
      },
    });
    const RoutesView = createRoutesView({
      routes: [
        ...withLayout(Layout, [
          createRouteView({
            route: first,
            view: defineComponent({ render: () => h('p', 'first') }),
          }),
          createRouteView({
            route: second,
            view: defineComponent({ render: () => h('p', 'second') }),
          }),
        ]),
        createRouteView({
          route: outside,
          view: defineComponent({ render: () => h('p', 'outside') }),
        }),
      ],
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(first.open, { scope, params: undefined });
    await allSettled(second.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toBe('second');
    expect(mounts).toBe(1);
    expect(unmounts).toBe(0);

    await allSettled(outside.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toBe('outside');
    expect(unmounts).toBe(1);
  });

  test('lazy import starts on render and exposes loading component', async () => {
    type LazyModule = {
      default: ReturnType<typeof defineComponent>;
      __esModule: true;
    };
    let resolve!: (module: LazyModule) => void;
    const route = createRoute({ path: '/lazy' });
    const importer = vi.fn(
      () => new Promise<LazyModule>((done) => (resolve = done)),
    );
    const fallback = defineComponent({
      setup: () => () => h('p', { id: 'lazy' }, 'loading'),
    });
    const loaded = defineComponent({
      setup: () => () => h('p', { id: 'lazy' }, 'loaded'),
    });
    const lazyView = createLazyRouteView({
      route,
      view: importer,
      fallback,
    });

    expect(importer).not.toHaveBeenCalled();

    const wrapper = mount(lazyView.view);
    await flushPromises();

    expect(importer).toHaveBeenCalledTimes(1);
    expect(wrapper.find('#lazy').text()).toBe('loading');

    resolve({ default: loaded, __esModule: true });
    await flushPromises();

    expect(wrapper.find('#lazy').text()).toBe('loaded');
  });

  test('lazy route view accepts a nested router', () => {
    const childRoute = createRoute({ path: '/child' });
    const nestedRouter = createRouter({ routes: [childRoute] });
    const importer = vi.fn(() =>
      Promise.resolve({ default: () => h('p', 'lazy') }),
    );

    expect(() =>
      createLazyRouteView({
        route: nestedRouter,
        view: importer,
      }),
    ).not.toThrow();
    expect(importer).not.toHaveBeenCalled();
  });

  test('lazy route view preserves recursive children and starts on render', async () => {
    const parentRoute = createRoute({ path: '/parent' });
    const childRoute = createRoute({ path: '/child', parent: parentRoute });
    const childView = createRouteView({
      route: childRoute,
      view: defineComponent({ render: () => h('p', 'child') }),
    });
    const importer = vi.fn(() =>
      Promise.resolve({
        default: defineComponent({ render: () => h('p', 'parent') }),
      }),
    );
    const lazyView = createLazyRouteView({
      route: parentRoute,
      view: importer,
      children: [childView],
    });

    expect(lazyView.children).toEqual([childView]);
    expect(importer).not.toHaveBeenCalled();

    mount(lazyView.view);
    await flushPromises();
    expect(importer).toHaveBeenCalledTimes(1);
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
        { route: route1, view: () => h('p', { id: 'message' }, 'route1') },
        { route: route2, view: () => h('p', { id: 'message' }, 'route2') },
      ],
      otherwise: () => h('p', { id: 'message' }, 'not found'),
    });

    const wrapper = mountRoutes(router, scope, RoutesView);

    await allSettled(route1.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.find('#message').text()).toBe('route1');

    await allSettled(route2.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.find('#message').text()).toBe('route2');

    await allSettled(router.navigate, {
      scope,
      params: { path: '/not-found', query: {} },
    });
    await flushPromises();
    expect(wrapper.find('#message').text()).toBe('not found');
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
          view: defineComponent({
            setup: () => () =>
              h('div', { 'data-testid': 'root' }, ['root', h(Outlet)]),
          }),
          children: [
            createRouteView({
              route: childRoute,
              view: defineComponent({
                setup: () => () =>
                  h('div', { 'data-testid': 'child' }, ['child', h(Outlet)]),
              }),
              children: [
                createRouteView({
                  route: leafRoute,
                  view: defineComponent({
                    setup: () => () =>
                      h('span', { 'data-testid': 'leaf' }, 'leaf'),
                  }),
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const wrapper = mountRoutes(router, scope, RoutesView);
    await flushPromises();

    expect(wrapper.find('[data-testid="root"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="child"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="leaf"]').exists()).toBe(true);
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
        createRouteView({
          route: childRoute,
          view: defineComponent({ render: () => h('p', 'child') }),
        }),
      ],
    });
    const RoutesView = createRoutesView({
      routes: [
        createRouteView({
          route: parentRoute,
          view: defineComponent({
            render: () => h('div', ['parent', h(Outlet)]),
          }),
          children: [
            createRouteView({ route: nestedRouter, view: NestedRoutesView }),
          ],
        }),
      ],
    });
    const wrapper = mountRoutes(router, scope, RoutesView);

    await allSettled(childRoute.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toContain('child');
  });

  test('link navigates on click', async () => {
    const route1 = createRoute({ path: '/app' });
    const route2 = createRoute({ path: '/faq/:id' });

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
          view: () =>
            h(
              Link,
              {
                to: route2,
                params: { id: '123' },
                query: { tab: 'details' },
                id: 'link',
              },
              () => 'to route2',
            ),
        },
        {
          route: route2,
          view: () => h(Link, { to: route1, id: 'link' }, () => 'to route1'),
        },
      ],
    });

    const wrapper = mountRoutes(router, scope, RoutesView);

    await allSettled(route1.open, { scope, params: undefined });
    await flushPromises();

    expect(wrapper.find('#link').attributes('href')).toBe(
      '/faq/123?tab=details',
    );

    await wrapper.find('#link').trigger('click');
    await allSettled(scope);
    await flushPromises();

    expect(scope.getState(route2.$isOpened)).toBeTruthy();
    expect(scope.getState(route2.$params)).toStrictEqual({ id: '123' });
    expect(scope.getState(router.$query)).toStrictEqual({ tab: 'details' });
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
          view: defineComponent({
            render: () =>
              h('div', [
                h(Link, { to: target, params: { id: '42' }, id: 'preserve' }),
                h(Link, {
                  to: target,
                  params: { id: '42' },
                  query: { tab: 'details', flag: null },
                  id: 'replace',
                }),
              ]),
          }),
        }),
      ],
    });
    const wrapper = mountRoutes(router, scope, RoutesView);

    expect(wrapper.find('#preserve').attributes('href')).toBe(
      '/target/42?flag&keep=yes',
    );
    expect(wrapper.find('#replace').attributes('href')).toBe(
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

  test('forwards attrs/events and supports empty query with replace', async () => {
    const source = createRoute({ path: '/source' });
    const target = createRoute({ path: '/target/:id' });
    const scope = fork();
    const router = createRouter({ routes: [source, target] });
    const history = createMemoryHistory({
      initialEntries: ['/source?stale=yes'],
    });
    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const onClick = vi.fn();
    const Links = defineComponent({
      setup: () => () =>
        h(Link, {
          to: target,
          params: { id: '42' },
          query: {},
          replace: true,
          id: 'target-link',
          'aria-label': 'Target',
          'data-kind': 'route',
          rel: 'nofollow',
          onClick,
        }),
    });
    const wrapper = mount(RouterProvider, {
      props: { router },
      slots: { default: () => h(Links) },
      global: { plugins: [EffectorScopePlugin({ scope })] },
    });

    const link = wrapper.find('#target-link');
    expect(link.attributes('href')).toBe('/target/42');
    expect(link.attributes('aria-label')).toBe('Target');
    expect(link.attributes('data-kind')).toBe('route');
    expect(link.attributes('rel')).toBe('nofollow');

    await link.trigger('click');
    await allSettled(scope);
    await flushPromises();

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(history.location.pathname + history.location.search).toBe(
      '/target/42',
    );
    expect(history.index).toBe(0);
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

    const Links = defineComponent({
      setup: () => () =>
        h('div', [
          h(Link, { to: routes.primary, id: 'primary' }),
          h(Link, { to: routes.middle, id: 'middle' }),
          h(Link, { to: routes.modified, id: 'modified' }),
          h(Link, { to: routes.blank, id: 'blank', target: '_blank' }),
          h(Link, { to: routes.download, id: 'download', download: 'file' }),
          h(Link, {
            to: routes.prevented,
            id: 'prevented',
            onClick: (event: MouseEvent) => event.preventDefault(),
          }),
          h(Link, { to: routes.external, id: 'external' }),
        ]),
    });
    const wrapper = mount(RouterProvider, {
      props: { router },
      slots: { default: () => h(Links) },
      global: { plugins: [EffectorScopePlugin({ scope })] },
    });

    wrapper
      .find('#external')
      .element.setAttribute('href', 'https://example.com/external');
    wrapper
      .find('#blank')
      .element.addEventListener('click', (event) => event.preventDefault());
    await wrapper.find('#middle').trigger('click', { button: 1 });
    await wrapper.find('#modified').trigger('click', { metaKey: true });
    await wrapper.find('#blank').trigger('click');
    await wrapper.find('#download').trigger('click');
    await wrapper.find('#prevented').trigger('click');
    await wrapper.find('#external').trigger('click');
    await wrapper.find('#primary').trigger('click');
    await allSettled(scope);
    await flushPromises();

    expect(scope.getState(routes.primary.$isOpened)).toBe(true);
    expect(scope.getState(routes.middle.$isOpened)).toBe(false);
    expect(scope.getState(routes.modified.$isOpened)).toBe(false);
    expect(scope.getState(routes.blank.$isOpened)).toBe(false);
    expect(scope.getState(routes.download.$isOpened)).toBe(false);
    expect(scope.getState(routes.prevented.$isOpened)).toBe(false);
    expect(scope.getState(routes.external.$isOpened)).toBe(false);
  });

  test('with layout', async () => {
    const profileRoute = createRoute({ path: '/profile' });
    const authRoute = createRoute({ path: '/auth' });

    const scope = fork();
    const router = createRouter({ routes: [profileRoute, authRoute] });
    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const ProfileLayout = defineComponent({
      setup(_, { slots }) {
        return () => [
          h('p', { 'data-testid': 'layout' }, 'layout!'),
          slots.default?.(),
        ];
      },
    });

    const RoutesView = createRoutesView({
      routes: [
        ...withLayout(ProfileLayout, [
          createRouteView({
            route: profileRoute,
            view: () => h('p', { 'data-testid': 'message' }, 'profile'),
          }),
        ]),
        createRouteView({
          route: authRoute,
          view: () => h('p', { 'data-testid': 'message' }, 'auth'),
        }),
      ],
    });

    const wrapper = mountRoutes(router, scope, RoutesView);

    await allSettled(profileRoute.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.find('[data-testid="layout"]').text()).toBe('layout!');
    expect(wrapper.find('[data-testid="message"]').text()).toBe('profile');

    await allSettled(authRoute.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.find('[data-testid="layout"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="message"]').text()).toBe('auth');
  });
});
