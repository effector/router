import { allSettled, fork } from 'effector';
import { inspectGraph } from 'effector/inspect';
import { createRoute, createRouter } from '@effector/router';
import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  defineComponent,
  h,
  KeepAlive,
  onActivated,
  onDeactivated,
  onMounted,
  ref,
  Transition,
  type Component,
} from 'vue';
import {
  createLazyRouteView,
  createRouteView,
  createRoutesView,
  Outlet,
  withLayout,
  type RouteView,
  type RouteViewSlotProps,
} from '../lib';
import { mountRoutes } from './helpers';

const text = (value: string) =>
  defineComponent({ render: () => h('p', value) });

// A page with local state: the button adds one to the number it shows.
function createCounterPage(name: string) {
  const counters = { mounts: 0 };
  const Page = defineComponent({
    name,
    setup() {
      const count = ref(0);

      onMounted(() => {
        counters.mounts += 1;
      });

      return () =>
        h('button', { onClick: () => (count.value += 1) }, [
          `${name}:${count.value}`,
        ]);
    },
  });

  return { Page, counters };
}

// The application passes the slot in a template. `<component :is>` receives
// the vnode from the slot, the documented way to render it.
function withSlot(RoutesView: Component, template: string) {
  return defineComponent({
    components: { RoutesView, KeepAlive, Transition },
    template: `<RoutesView v-slot="{ Component, view }">${template}</RoutesView>`,
  });
}

// `last` is declared last, so it wins while both routes are opened. Closing it
// shows `first` again.
async function switchAndBack(
  scope: ReturnType<typeof fork>,
  last: { open: any; close: any },
) {
  await allSettled(last.open, { scope, params: undefined });
  await flushPromises();
  await allSettled(last.close, { scope });
  await flushPromises();
}

describe('scoped slot of RoutesView and Outlet', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('the slot receives the vnode of the view and the view', async () => {
    const route = createRoute();
    const scope = fork();
    const view = createRouteView({ route, view: text('page') });
    const seen: RouteViewSlotProps[] = [];
    const RoutesView = createRoutesView({ routes: [view] });
    const App = defineComponent({
      setup: () => () =>
        h(RoutesView, null, {
          default: (props: RouteViewSlotProps) => {
            seen.push(props);

            return h('main', [props.Component]);
          },
        }),
    });
    const wrapper = mountRoutes(createRouter({ routes: [] }), scope, App);

    expect(seen.at(-1)).toEqual({ Component: null, view: null });
    expect(wrapper.text()).toBe('');

    await allSettled(route.open, { scope, params: undefined });
    await flushPromises();

    expect(seen.at(-1)?.view).toBe(view);
    expect(wrapper.html()).toBe('<main>\n  <p>page</p>\n</main>');
  });

  test('the slot receives otherwise as Component with view null', () => {
    const scope = fork();
    const RoutesView = createRoutesView({
      routes: [createRouteView({ route: createRoute(), view: text('page') })],
      otherwise: text('not found'),
    });
    const App = withSlot(
      RoutesView,
      '<main :data-view="String(view)"><component :is="Component" /></main>',
    );
    const wrapper = mountRoutes(createRouter({ routes: [] }), scope, App);

    expect(wrapper.html()).toBe(
      '<main data-view="null">\n  <p>not found</p>\n</main>',
    );
  });

  test('without a slot the markup is the same as before', async () => {
    const route = createRoute();
    const scope = fork();
    const RoutesView = createRoutesView({
      routes: [createRouteView({ route, view: text('page') })],
      otherwise: text('not found'),
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    expect(wrapper.html()).toBe('<p>not found</p>');

    await allSettled(route.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.html()).toBe('<p>page</p>');
  });

  test('a slot with one root keeps the attributes of RoutesView', async () => {
    const route = createRoute();
    const scope = fork();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const RoutesView = createRoutesView({
      routes: [createRouteView({ route, view: text('page') })],
    });
    const App = defineComponent({
      components: { RoutesView },
      template: `
        <RoutesView class="shell" v-slot="{ Component }">
          <main><component :is="Component" /></main>
        </RoutesView>
      `,
    });
    const wrapper = mountRoutes(createRouter({ routes: [] }), scope, App);

    await allSettled(route.open, { scope, params: undefined });
    await flushPromises();

    expect(wrapper.html()).toBe('<main class="shell">\n  <p>page</p>\n</main>');
    // Vue warns when it cannot pass the attributes to a fragment root.
    expect(warn).not.toHaveBeenCalled();
  });

  test('KeepAlive around the slot Component keeps the state of a page across a switch and back', async () => {
    const first = createRoute();
    const second = createRoute();
    const scope = fork();
    const { Page, counters } = createCounterPage('first');
    const RoutesView = createRoutesView({
      routes: [
        createRouteView({ route: first, view: Page }),
        createRouteView({ route: second, view: text('second') }),
      ],
    });
    const App = withSlot(
      RoutesView,
      '<KeepAlive><component :is="Component" /></KeepAlive>',
    );
    const wrapper = mountRoutes(createRouter({ routes: [] }), scope, App);

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
    expect(counters.mounts).toBe(1);
  });

  test('KeepAlive include matches a lazy view by its name before the chunk loads', async () => {
    const lazy = createRoute();
    const plain = createRoute();
    const scope = fork();
    let fallbackMounts = 0;
    const Fallback = defineComponent({
      setup() {
        onMounted(() => {
          fallbackMounts += 1;
        });

        return () => h('p', 'loading');
      },
    });
    const RoutesView = createRoutesView({
      routes: [
        createLazyRouteView({
          route: lazy,
          // The chunk never loads in this test.
          view: () => new Promise<{ default: Component }>(() => {}),
          fallback: Fallback,
          name: 'LazyPage',
        }),
        createRouteView({ route: plain, view: text('plain') }),
      ],
    });
    const App = withSlot(
      RoutesView,
      '<KeepAlive include="LazyPage"><component :is="Component" /></KeepAlive>',
    );
    const wrapper = mountRoutes(createRouter({ routes: [] }), scope, App);

    await allSettled(lazy.open, { scope, params: undefined });
    await flushPromises();
    await switchAndBack(scope, plain);
    await switchAndBack(scope, plain);

    expect(wrapper.text()).toBe('loading');
    // Without the cache the fallback mounts on every return to the view.
    expect(fallbackMounts).toBe(1);
  });

  // Behavior of Vue, not of this package: `onActivated` of a component
  // mounted below an already active `KeepAlive` child is not called on that
  // mount. Vue makes one exception, for an async wrapper that is the direct
  // child of `KeepAlive`, and here the host of the view is that child.
  // docs/how-to/vue-keep-alive-and-transition.md and the reference page of
  // `createLazyRouteView` state these two facts.
  test.each([
    ['is activated from its second show (current behavior)', false],
    ['is activated on its first show after preload', true],
  ])('a lazy view under KeepAlive %s', async (_, preloaded) => {
    const lazy = createRoute();
    const plain = createRoute();
    const scope = fork();
    const log: string[] = [];
    const Page = defineComponent({
      setup() {
        onMounted(() => log.push('mount'));
        onActivated(() => log.push('activated'));
        onDeactivated(() => log.push('deactivated'));

        return () => h('p', 'lazy');
      },
    });
    const LazyView = createLazyRouteView({
      route: lazy,
      view: () => Promise.resolve({ default: Page, __esModule: true }),
    });
    const RoutesView = createRoutesView({
      routes: [
        LazyView,
        createRouteView({ route: plain, view: text('plain') }),
      ],
    });
    const App = withSlot(
      RoutesView,
      '<KeepAlive><component :is="Component" /></KeepAlive>',
    );

    if (preloaded) await LazyView.preload();

    const wrapper = mountRoutes(createRouter({ routes: [] }), scope, App);

    await allSettled(lazy.open, { scope, params: undefined });
    await flushPromises();

    expect(wrapper.text()).toBe('lazy');
    expect(log).toEqual(preloaded ? ['mount', 'activated'] : ['mount']);

    log.length = 0;
    await switchAndBack(scope, plain);

    expect(log).toEqual(['deactivated', 'activated']);
  });

  test('KeepAlive include matches a group host by the name of its layout', async () => {
    const grouped = createRoute();
    const plain = createRoute();
    const scope = fork();
    const layout = { mounts: 0 };
    const Layout = defineComponent({
      name: 'ShellLayout',
      setup(_, { slots }) {
        onMounted(() => {
          layout.mounts += 1;
        });

        return () => h('section', slots.default?.());
      },
    });
    const { Page, counters } = createCounterPage('grouped');
    const RoutesView = createRoutesView({
      routes: [
        ...withLayout(Layout, [
          createRouteView({ route: grouped, view: Page }),
        ]),
        createRouteView({ route: plain, view: text('plain') }),
      ],
    });
    const App = withSlot(
      RoutesView,
      '<KeepAlive include="ShellLayout"><component :is="Component" /></KeepAlive>',
    );
    const wrapper = mountRoutes(createRouter({ routes: [] }), scope, App);

    await allSettled(grouped.open, { scope, params: undefined });
    await flushPromises();
    await wrapper.find('button').trigger('click');
    await switchAndBack(scope, plain);
    await switchAndBack(scope, plain);

    expect(wrapper.text()).toBe('grouped:1');
    expect(layout.mounts).toBe(1);
    expect(counters.mounts).toBe(1);
  });

  test('Transition receives the changing vnode', async () => {
    const first = createRoute();
    const second = createRoute();
    const scope = fork();
    const log: string[] = [];
    const RoutesView = createRoutesView({
      routes: [
        createRouteView({ route: first, view: text('first') }),
        createRouteView({ route: second, view: text('second') }),
      ],
    });
    const App = defineComponent({
      setup: () => () =>
        h(RoutesView, null, {
          default: ({ Component }: RouteViewSlotProps) =>
            h(
              Transition,
              {
                mode: 'out-in',
                css: false,
                // `done` ends the phase. A real hook calls it when its
                // animation ends, so here it is called after the hook.
                onLeave: (el: Element, done: () => void) => {
                  log.push(`leave ${el.textContent}`);
                  void Promise.resolve().then(done);
                },
                onEnter: (el: Element, done: () => void) => {
                  log.push(`enter ${el.textContent}`);
                  void Promise.resolve().then(done);
                },
              },
              () => Component,
            ),
        }),
    });
    // @vue/test-utils replaces Transition by a stub unless told otherwise.
    const wrapper = mountRoutes(createRouter({ routes: [] }), scope, App, {
      stubs: { transition: false },
    });

    await allSettled(first.open, { scope, params: undefined });
    await flushPromises();
    await allSettled(second.open, { scope, params: undefined });
    await flushPromises();

    expect(wrapper.text()).toBe('second');
    expect(log).toEqual(['enter first', 'leave first', 'enter second']);
  });

  test('the slot of Outlet receives the child view', async () => {
    const parent = createRoute();
    const child = createRoute();
    const scope = fork();
    const childView = createRouteView({ route: child, view: text('child') });
    const seen: (RouteView | null)[] = [];
    const Parent = defineComponent({
      setup: () => () =>
        h(Outlet, null, {
          default: ({ Component, view }: RouteViewSlotProps) => {
            seen.push(view);

            return h('aside', [Component]);
          },
        }),
    });
    const RoutesView = createRoutesView({
      routes: [
        createRouteView({ route: parent, view: Parent, children: [childView] }),
      ],
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(parent.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toBe('');
    expect(seen.at(-1)).toBe(null);

    await allSettled(child.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.html()).toBe('<aside>\n  <p>child</p>\n</aside>');
    expect(seen.at(-1)).toBe(childView);
  });

  test('creates no stores when a routes view and an outlet with slots mount', async () => {
    const parent = createRoute();
    const child = createRoute();
    const scope = fork();
    const router = createRouter({ routes: [] });
    const Parent = defineComponent({
      components: { Outlet, KeepAlive },
      template: `
        <Outlet v-slot="{ Component }">
          <KeepAlive><component :is="Component" /></KeepAlive>
        </Outlet>
      `,
    });
    const RoutesView = createRoutesView({
      routes: [
        createRouteView({
          route: parent,
          view: Parent,
          children: [createRouteView({ route: child, view: text('child') })],
        }),
      ],
    });
    const App = withSlot(
      RoutesView,
      '<KeepAlive><component :is="Component" /></KeepAlive>',
    );

    await allSettled(parent.open, { scope, params: undefined });
    await allSettled(child.open, { scope, params: undefined });

    const stores: string[] = [];
    const inspection = inspectGraph({
      fn: (declaration) => {
        if (declaration.type === 'unit' && declaration.kind === 'store') {
          stores.push(declaration.id);
        }
      },
    });

    for (let i = 0; i < 3; i++) {
      const wrapper = mountRoutes(router, scope, App);
      expect(wrapper.text()).toBe('child');
      wrapper.unmount();
    }
    inspection.unsubscribe();

    expect(stores).toEqual([]);
  });
});
