import { allSettled, fork } from 'effector';
import { inspectGraph } from 'effector/inspect';
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { flushPromises, mount } from '@vue/test-utils';
import { EffectorScopePlugin } from 'effector-vue/composition';
import { createMemoryHistory } from 'history';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  defineComponent,
  h,
  KeepAlive,
  onActivated,
  onDeactivated,
  onMounted,
  onUnmounted,
  ref,
  type Component,
} from 'vue';
import {
  createRouteView,
  createRoutesView,
  LayoutOutlet,
  Outlet,
  withLayout,
  type RouteViewSlotProps,
} from '../lib';
import { mountRoutes } from './helpers';

const text = (value: string) =>
  defineComponent({ render: () => h('p', value) });

// Writes mounts and unmounts of a component to a shared log.
function logged(log: string[], name: string, render: () => unknown) {
  return defineComponent({
    name,
    setup() {
      onMounted(() => log.push(`${name}:mount`));
      onUnmounted(() => log.push(`${name}:unmount`));

      return render;
    },
  });
}

// A page with local state: the button adds one to the number it shows.
function createCounterPage(name: string) {
  return defineComponent({
    name,
    setup() {
      const count = ref(0);

      return () =>
        h('button', { onClick: () => (count.value += 1) }, [
          `${name}:${count.value}`,
        ]);
    },
  });
}

// A layout that keeps its pages alive through the slot of LayoutOutlet.
const keepAliveLayout = (extra: object = {}) =>
  defineComponent({
    ...extra,
    components: { LayoutOutlet, KeepAlive },
    template: `
      <section>
        <LayoutOutlet v-slot="{ Component }">
          <KeepAlive><component :is="Component" /></KeepAlive>
        </LayoutOutlet>
      </section>
    `,
  });

describe('LayoutOutlet', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('LayoutOutlet renders the page of its group', async () => {
    const first = createRoute();
    const second = createRoute();
    const scope = fork();
    const Layout = defineComponent({
      render: () => h('section', ['layout:', h(LayoutOutlet)]),
    });
    const RoutesView = createRoutesView({
      routes: withLayout(Layout, [
        createRouteView({ route: first, view: text('first') }),
        createRouteView({ route: second, view: text('second') }),
      ]),
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(first.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toBe('layout:first');

    // `second` is declared last, so it wins while both routes are opened.
    await allSettled(second.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toBe('layout:second');
  });

  test('the slot of LayoutOutlet receives the page and its view', async () => {
    const route = createRoute();
    const scope = fork();
    const view = createRouteView({ route, view: text('page') });
    const seen: RouteViewSlotProps[] = [];
    const Layout = defineComponent({
      render: () =>
        h(LayoutOutlet, null, {
          default: (props: RouteViewSlotProps) => {
            seen.push(props);

            return h('main', [props.Component]);
          },
        }),
    });
    const [grouped] = withLayout(Layout, [view]);
    const RoutesView = createRoutesView({ routes: [grouped] });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(route.open, { scope, params: undefined });
    await flushPromises();

    expect(wrapper.html()).toBe('<main>\n  <p>page</p>\n</main>');
    expect(seen.at(-1)?.view).toBe(grouped);
  });

  test('KeepAlive in a layout keeps a page while the layout stays mounted', async () => {
    const first = createRoute();
    const second = createRoute();
    const scope = fork();
    const RoutesView = createRoutesView({
      routes: withLayout(keepAliveLayout(), [
        createRouteView({ route: first, view: createCounterPage('first') }),
        createRouteView({ route: second, view: text('second') }),
      ]),
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(first.open, { scope, params: undefined });
    await flushPromises();
    await wrapper.find('button').trigger('click');
    expect(wrapper.text()).toBe('first:1');

    await allSettled(second.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toBe('second');

    await allSettled(second.close, { scope });
    await flushPromises();
    expect(wrapper.text()).toBe('first:1');
  });

  test('an Outlet in a page under LayoutOutlet renders the children of the page', async () => {
    const parent = createRoute();
    const child = createRoute();
    const scope = fork();
    const Layout = defineComponent({
      render: () => h('section', ['layout:', h(LayoutOutlet)]),
    });
    const RoutesView = createRoutesView({
      routes: withLayout(Layout, [
        createRouteView({
          route: parent,
          view: defineComponent({
            render: () => h('div', ['parent:', h(Outlet)]),
          }),
          children: [createRouteView({ route: child, view: text('child') })],
        }),
      ]),
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(parent.open, { scope, params: undefined });
    await allSettled(child.open, { scope, params: undefined });
    await flushPromises();

    expect(wrapper.text()).toBe('layout:parent:child');
  });

  test('a layout with the default slot renders as in 0.1.0', async () => {
    const route = createRoute();
    const scope = fork();
    const Layout = defineComponent({
      setup:
        (_, { slots }) =>
        () =>
          h('section', slots.default?.()),
    });
    const RoutesView = createRoutesView({
      routes: withLayout(Layout, [
        createRouteView({ route, view: text('page') }),
      ]),
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(route.open, { scope, params: undefined });
    await flushPromises();

    expect(wrapper.html()).toBe('<section>\n  <p>page</p>\n</section>');
  });

  test('LayoutOutlet outside a withLayout layout renders nothing and reports it', async () => {
    const route = createRoute();
    const scope = fork();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // The `layout` option of a view is not a `withLayout` group.
    const Layout = defineComponent({
      render: () => h('section', ['layout:', h(LayoutOutlet)]),
    });
    const RoutesView = createRoutesView({
      routes: [createRouteView({ route, view: text('page'), layout: Layout })],
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(route.open, { scope, params: undefined });
    await flushPromises();

    expect(wrapper.text()).toBe('layout:');
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(
      '[@effector/router-vue] <LayoutOutlet /> renders nothing outside a layout passed to withLayout',
    );
  });

  test('a LayoutOutlet inside a page does not render the page again', async () => {
    const route = createRoute();
    const scope = fork();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Layout = defineComponent({
      render: () => h('section', ['layout:', h(LayoutOutlet)]),
    });
    const Page = defineComponent({
      render: () => h('div', ['page:', h(LayoutOutlet)]),
    });
    const RoutesView = createRoutesView({
      routes: withLayout(Layout, [createRouteView({ route, view: Page })]),
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(route.open, { scope, params: undefined });
    await flushPromises();

    expect(wrapper.text()).toBe('layout:page:');
    expect(error).toHaveBeenCalledTimes(1);
  });

  test('creates no stores when a layout with LayoutOutlet mounts', async () => {
    const route = createRoute();
    const scope = fork();
    const router = createRouter({ routes: [] });
    const RoutesView = createRoutesView({
      routes: withLayout(keepAliveLayout(), [
        createRouteView({ route, view: text('page') }),
      ]),
    });

    await allSettled(route.open, { scope, params: undefined });

    const stores: string[] = [];
    const inspection = inspectGraph({
      fn: (declaration) => {
        if (declaration.type === 'unit' && declaration.kind === 'store') {
          stores.push(declaration.id);
        }
      },
    });

    for (let i = 0; i < 3; i++) {
      const wrapper = mountRoutes(router, scope, RoutesView);
      expect(wrapper.text()).toBe('page');
      wrapper.unmount();
    }
    inspection.unsubscribe();

    expect(stores).toEqual([]);
  });
});

describe('LayoutOutlet and a navigation by path', () => {
  async function setup(
    Layout: Component,
    pages: { a: Component; b: Component; otherwise?: Component },
    wrap: (RoutesView: Component) => Component = (RoutesView) => RoutesView,
  ) {
    const a = createRoute({ path: '/a' });
    const b = createRoute({ path: '/b' });
    const scope = fork();
    const router = createRouter({ routes: [a, b] });
    const history = createMemoryHistory({ initialEntries: ['/a'] });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const RoutesView = createRoutesView({
      routes: withLayout(Layout, [
        createRouteView({ route: a, view: pages.a }),
        createRouteView({ route: b, view: pages.b }),
      ]),
      otherwise: pages.otherwise,
    });
    const wrapper = mountRoutes(router, scope, wrap(RoutesView));
    const go = async (path: string) => {
      await allSettled(router.navigate, { scope, params: { path } });
      await flushPromises();
    };

    await flushPromises();

    return { wrapper, go };
  }

  // The fact the reference page of LayoutOutlet states. The first route
  // closes before the second opens, and no view of the group is opened in
  // between.
  test('a path navigation between two pages of a group remounts the layout (current behavior)', async () => {
    const log: string[] = [];
    const Layout = logged(log, 'layout', () => h(LayoutOutlet));
    const { wrapper, go } = await setup(Layout, {
      a: logged(log, 'a', () => h('p', 'a')),
      b: logged(log, 'b', () => h('p', 'b')),
      otherwise: logged(log, 'otherwise', () => h('p', 'otherwise')),
    });

    expect(wrapper.text()).toBe('a');
    log.length = 0;
    await go('/b');

    expect(wrapper.text()).toBe('b');
    expect(log).toEqual([
      'a:unmount',
      'layout:unmount',
      'otherwise:mount',
      'otherwise:unmount',
      'b:mount',
      'layout:mount',
    ]);
  });

  test('KeepAlive at RoutesView and in the layout keeps a page across a path navigation', async () => {
    let layoutSetups = 0;
    const Layout = keepAliveLayout({
      setup() {
        layoutSetups += 1;

        return {};
      },
    });
    const { wrapper, go } = await setup(
      Layout,
      { a: createCounterPage('a'), b: text('b') },
      (RoutesView) =>
        defineComponent({
          components: { RoutesView, KeepAlive },
          template: `
            <RoutesView v-slot="{ Component }">
              <KeepAlive><component :is="Component" /></KeepAlive>
            </RoutesView>
          `,
        }),
    );

    await wrapper.find('button').trigger('click');
    expect(wrapper.text()).toBe('a:1');

    await go('/b');
    expect(wrapper.text()).toBe('b');

    await go('/a');
    expect(wrapper.text()).toBe('a:1');
    expect(layoutSetups).toBe(1);
  });

  // A page with the four hooks that `KeepAlive` drives.
  const hooked = (log: string[], name: string) =>
    defineComponent({
      name,
      setup() {
        onMounted(() => log.push(`${name}:mount`));
        onUnmounted(() => log.push(`${name}:unmount`));
        onActivated(() => log.push(`${name}:activated`));
        onDeactivated(() => log.push(`${name}:deactivated`));

        return () => h('p', name);
      },
    });
  const keptAlive = (RoutesView: Component) =>
    defineComponent({
      components: { RoutesView, KeepAlive },
      template: `
        <RoutesView v-slot="{ Component }">
          <KeepAlive><component :is="Component" /></KeepAlive>
        </RoutesView>
      `,
    });

  test('a kept-alive layout activates only the page it shows', async () => {
    const log: string[] = [];
    const { go } = await setup(
      keepAliveLayout(),
      { a: hooked(log, 'A'), b: hooked(log, 'B') },
      keptAlive,
    );

    expect(log).toEqual(['A:mount', 'A:activated']);

    log.length = 0;
    await go('/b');
    expect(log).toEqual(['A:deactivated', 'B:mount', 'B:activated']);

    log.length = 0;
    await go('/a');
    expect(log).toEqual(['B:deactivated', 'A:activated']);
  });

  test('a page under a kept-alive layout is activated after it mounts', async () => {
    const log: string[] = [];
    const Layout = defineComponent({
      components: { LayoutOutlet },
      template: `<section><LayoutOutlet /></section>`,
    });
    const { go } = await setup(
      Layout,
      { a: hooked(log, 'A'), b: hooked(log, 'B') },
      keptAlive,
    );

    await go('/b');
    log.length = 0;
    await go('/a');

    // `B:deactivated` comes from the layout itself: it is deactivated while
    // no view of the group is opened.
    expect(log).toEqual([
      'B:deactivated',
      'B:unmount',
      'A:mount',
      'A:activated',
    ]);
  });
});

describe('LayoutOutlet and two copies of the package', () => {
  // `vi.resetModules()` makes the next import evaluate the package again, as
  // an application does when it loads the ESM and the CJS build together.
  test('a layout of one copy and a LayoutOutlet from the other meet', async () => {
    const first = await import('../lib');

    vi.resetModules();

    const second = await import('../lib');
    const route = createRoute();
    const scope = fork();
    const RoutesView = first.createRoutesView({
      routes: first.withLayout(
        () => h('section', ['layout:', h(second.LayoutOutlet)]),
        [first.createRouteView({ route, view: () => h('b', 'page') })],
      ),
    });

    expect(second.LayoutOutlet).not.toBe(first.LayoutOutlet);

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
