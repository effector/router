import { allSettled, fork } from 'effector';
import {
  createRoute,
  createRouter,
  historyAdapter,
  type Router,
} from '@effector/router';
import { flushPromises, mount } from '@vue/test-utils';
import { EffectorScopePlugin } from 'effector-vue/composition';
import { createMemoryHistory } from 'history';
import { describe, expect, test, vi } from 'vitest';
import { createApp, defineComponent, h, onMounted, toRaw } from 'vue';
import {
  createRouteView,
  createRouterPlugin,
  createRoutesView,
  Link,
  RouterProvider,
  useRouterContext,
} from '../lib';

// `RouterProvider` provides its `router` prop, which Vue hands out as a
// reactive proxy, so the routers are compared by `toRaw` identity.
function createShowRouter(onRouter: (router: Router) => void) {
  return defineComponent({
    setup() {
      onRouter(toRaw(useRouterContext()));

      return () => null;
    },
  });
}

describe('createRouterPlugin', () => {
  // The bootstrap recipe of docs/reference/vue/create-router-plugin.md.
  test('provides the router without RouterProvider', async () => {
    const home = createRoute({ path: '/home' });
    const profile = createRoute({ path: '/profile' });
    const router = createRouter({ routes: [home, profile] });
    const scope = fork();
    let otherwiseMounts = 0;
    const RoutesView = createRoutesView({
      routes: [
        createRouteView({
          route: home,
          view: () => h(Link, { to: profile, id: 'link' }, () => 'home'),
        }),
        createRouteView({ route: profile, view: () => h('p', 'profile') }),
      ],
      otherwise: defineComponent({
        setup() {
          onMounted(() => {
            otherwiseMounts += 1;
          });

          return () => h('p', 'not found');
        },
      }),
    });

    // The history goes in before mount, so the first render has the page.
    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(
        createMemoryHistory({ initialEntries: ['/home'] }),
      ),
    });

    const root = document.createElement('div');
    const app = createApp(RoutesView)
      .use(EffectorScopePlugin({ scope }))
      .use(createRouterPlugin({ router }));

    app.mount(root);
    expect(root.textContent).toBe('home');
    expect(otherwiseMounts).toBe(0);

    root.querySelector<HTMLAnchorElement>('#link')!.click();
    await allSettled(scope);
    await flushPromises();

    expect(root.textContent).toBe('profile');
    app.unmount();
  });

  test('nested RouterProvider overrides the plugin', () => {
    const fromPlugin = createRouter({ routes: [] });
    const fromProvider = createRouter({ routes: [] });
    const seen: Record<string, Router> = {};

    mount(
      defineComponent({
        render: () => [
          h(createShowRouter((router) => (seen.outside = router))),
          h(RouterProvider, { router: fromProvider }, () =>
            h(createShowRouter((router) => (seen.inside = router))),
          ),
        ],
      }),
      { global: { plugins: [createRouterPlugin({ router: fromPlugin })] } },
    );

    expect(seen.outside === fromPlugin).toBe(true);
    expect(seen.inside === fromProvider).toBe(true);
  });

  test('registers no global components', () => {
    const app = createApp({ render: () => null });

    app.use(createRouterPlugin({ router: createRouter({ routes: [] }) }));

    for (const name of ['RouterProvider', 'RoutesView', 'Outlet', 'Link']) {
      expect(app.component(name)).toBeUndefined();
    }
  });
});

describe('keys shared by two copies of the package', () => {
  // `vi.resetModules()` makes the next import evaluate the package again, as
  // an application does when it loads the ESM and the CJS build together.
  test('a provider and a consumer from two copies of the package meet', async () => {
    const first = await import('../lib');

    vi.resetModules();

    const second = await import('../lib');
    const router = createRouter({ routes: [] });
    let seen: Router | undefined;

    expect(second.useRouterContext).not.toBe(first.useRouterContext);

    mount(first.RouterProvider, {
      props: { router },
      slots: {
        default: () =>
          h(
            defineComponent({
              setup() {
                seen = toRaw(second.useRouterContext());

                return () => null;
              },
            }),
          ),
      },
    });

    expect(seen === router).toBe(true);
  });

  test('a view host from one copy and an Outlet from the other meet', async () => {
    const first = await import('../lib');

    vi.resetModules();

    const second = await import('../lib');
    const parent = createRoute();
    const child = createRoute();
    const scope = fork();
    const RoutesView = first.createRoutesView({
      routes: [
        first.createRouteView({
          route: parent,
          view: () => h('div', ['parent:', h(second.Outlet)]),
          children: [
            first.createRouteView({
              route: child,
              view: () => h('b', 'child'),
            }),
          ],
        }),
      ],
    });

    expect(second.Outlet).not.toBe(first.Outlet);

    const wrapper = mount(first.RouterProvider, {
      props: { router: createRouter({ routes: [] }) },
      slots: { default: () => h(RoutesView) },
      global: { plugins: [EffectorScopePlugin({ scope })] },
    });

    await allSettled(parent.open, { scope, params: undefined });
    await allSettled(child.open, { scope, params: undefined });
    await flushPromises();

    expect(wrapper.text()).toBe('parent:child');
  });

  test('withLayout from one copy and a routes view from the other keep the layout', async () => {
    const first = await import('../lib');

    vi.resetModules();

    const second = await import('../lib');
    const route = createRoute();
    const scope = fork();
    const RoutesView = first.createRoutesView({
      routes: second.withLayout(
        (_, { slots }) => h('div', ['layout:', slots.default?.()]),
        [first.createRouteView({ route, view: () => h('b', 'page') })],
      ),
    });

    expect(second.withLayout).not.toBe(first.withLayout);

    const wrapper = mount(first.RouterProvider, {
      props: { router: createRouter({ routes: [] }) },
      slots: { default: () => h(RoutesView) },
      global: { plugins: [EffectorScopePlugin({ scope })] },
    });

    await allSettled(route.open, { scope, params: undefined });
    await flushPromises();

    expect(wrapper.text()).toBe('layout:page');
  });
});
