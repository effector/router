import { allSettled, fork } from 'effector';
import { createRoute, createRouter } from '@effector/router';
import { flushPromises, mount } from '@vue/test-utils';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  test,
  vi,
} from 'vitest';
import {
  defineComponent,
  h,
  KeepAlive,
  onMounted,
  Suspense,
  type Component,
} from 'vue';
import {
  createLazyRouteView,
  createRouteView,
  createRoutesView,
  withLayout,
  type LazyRouteView,
  type RouteView,
} from '../lib';
import { mountRoutes } from './helpers';

// A real `import()` yields a module namespace. Vue takes `default` from an
// object only when it is marked as one.
type LazyModule = { default: Component; __esModule: true };
const moduleOf = (component: Component): LazyModule => ({
  default: component,
  __esModule: true,
});

const text = (value: string) =>
  defineComponent({ render: () => h('p', value) });
const Loaded = text('loaded');
const Fallback = text('loading');
const ErrorView = defineComponent({
  props: { error: { type: Error, required: true } },
  setup: (props) => () => h('p', `error: ${props.error.message}`),
});

function deferred() {
  let resolve!: (module: LazyModule) => void;
  const promise = new Promise<LazyModule>((done) => (resolve = done));

  return { promise, resolve };
}

describe('createLazyRouteView async options', () => {
  // Vue reports a failed loader through console even when `error` handles it.
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('shows error when the loader rejects', async () => {
    const lazyView = createLazyRouteView({
      route: createRoute(),
      view: () => Promise.reject(new Error('no chunk')),
      fallback: Fallback,
      error: ErrorView,
    });
    const wrapper = mount(lazyView.view);

    expect(wrapper.text()).toBe('loading');
    await flushPromises();
    expect(wrapper.text()).toBe('error: no chunk');
  });

  test('onError retry renders the view', async () => {
    const importer = vi
      .fn<() => Promise<LazyModule>>()
      .mockRejectedValueOnce(new Error('no chunk'))
      .mockResolvedValueOnce(moduleOf(Loaded));
    const onError = vi.fn(
      (_error: Error, retry: () => void, fail: () => void, attempts: number) =>
        attempts < 2 ? retry() : fail(),
    );
    const lazyView = createLazyRouteView({
      route: createRoute(),
      view: importer,
      fallback: Fallback,
      error: ErrorView,
      onError,
    });
    const wrapper = mount(lazyView.view);

    await flushPromises();

    expect(wrapper.text()).toBe('loaded');
    expect(importer).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  test('shows error after timeout', async () => {
    const lazyView = createLazyRouteView({
      route: createRoute(),
      view: () => deferred().promise,
      fallback: Fallback,
      error: ErrorView,
      timeout: 10,
    });
    const wrapper = mount(lazyView.view);

    expect(wrapper.text()).toBe('loading');
    await vi.waitFor(() =>
      expect(wrapper.text()).toBe(
        'error: Async component timed out after 10ms.',
      ),
    );
  });

  test('shows fallback under an ancestor Suspense', async () => {
    const chunk = deferred();
    const lazyView = createLazyRouteView({
      route: createRoute(),
      view: () => chunk.promise,
      fallback: Fallback,
    });
    const wrapper = mount(
      defineComponent({
        render: () =>
          h(Suspense, null, {
            default: () => h(lazyView.view),
            fallback: () => h('p', 'suspense'),
          }),
      }),
    );

    await flushPromises();
    expect(wrapper.text()).toBe('loading');

    chunk.resolve(moduleOf(Loaded));
    await flushPromises();
    expect(wrapper.text()).toBe('loaded');
  });

  test('suspensible: true waits in Suspense', async () => {
    const chunk = deferred();
    let fallbackMounts = 0;
    const lazyView = createLazyRouteView({
      route: createRoute(),
      view: () => chunk.promise,
      fallback: defineComponent({
        setup() {
          onMounted(() => {
            fallbackMounts += 1;
          });
          return () => h('p', 'loading');
        },
      }),
      suspensible: true,
    });
    const wrapper = mount(
      defineComponent({
        render: () =>
          h(Suspense, null, {
            default: () => h(lazyView.view),
            fallback: () => h('p', 'suspense'),
          }),
      }),
    );

    await flushPromises();
    expect(wrapper.text()).toBe('suspense');

    chunk.resolve(moduleOf(Loaded));
    await flushPromises();
    expect(wrapper.text()).toBe('loaded');
    expect(fallbackMounts).toBe(0);
  });
});

describe('createLazyRouteView preload', () => {
  function createCountedFallback() {
    const counters = { setups: 0 };
    const CountedFallback = defineComponent({
      setup() {
        counters.setups += 1;

        return () => h('p', 'loading');
      },
    });

    return { CountedFallback, counters };
  }

  test('preload loads the chunk once', async () => {
    const chunk = deferred();
    const importer = vi.fn(() => chunk.promise);
    const lazyView = createLazyRouteView({
      route: createRoute(),
      view: importer,
      fallback: Fallback,
    });
    // The render and both preload calls share one request.
    const wrapper = mount(lazyView.view);
    const first = lazyView.preload();
    const second = lazyView.preload();

    chunk.resolve(moduleOf(Loaded));

    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBeUndefined();
    await flushPromises();

    expect(wrapper.text()).toBe('loaded');
    expect(importer).toHaveBeenCalledTimes(1);
  });

  test('a view mounted after preload never mounts the fallback', async () => {
    const { CountedFallback, counters } = createCountedFallback();
    const lazyView = createLazyRouteView({
      route: createRoute(),
      view: () => Promise.resolve(moduleOf(Loaded)),
      fallback: CountedFallback,
    });

    await lazyView.preload();

    const wrapper = mount(lazyView.view);

    // Checked right after mount, with no awaited tick in between.
    expect(wrapper.text()).toBe('loaded');
    expect(counters.setups).toBe(0);

    await flushPromises();
    expect(counters.setups).toBe(0);
  });

  test('a view with a layout mounted after preload never mounts the fallback', async () => {
    const { CountedFallback, counters } = createCountedFallback();
    const lazyView = createLazyRouteView({
      route: createRoute(),
      view: () => Promise.resolve(moduleOf(Loaded)),
      fallback: CountedFallback,
      layout: defineComponent({
        setup:
          (_, { slots }) =>
          () =>
            h('section', slots.default?.()),
      }),
    });

    await lazyView.preload();

    const wrapper = mount(lazyView.view);

    expect(wrapper.html()).toBe('<section>\n  <p>loaded</p>\n</section>');
    expect(counters.setups).toBe(0);
  });

  test('a failed preload does not break later loads', async () => {
    const importer = vi
      .fn<() => Promise<LazyModule>>()
      .mockRejectedValueOnce(new Error('no chunk'))
      .mockResolvedValueOnce(moduleOf(Loaded));
    const lazyView = createLazyRouteView({
      route: createRoute(),
      view: importer,
      fallback: Fallback,
      error: ErrorView,
    });

    await expect(lazyView.preload()).rejects.toThrow('no chunk');

    const wrapper = mount(lazyView.view);

    await flushPromises();

    expect(wrapper.text()).toBe('loaded');
    expect(importer).toHaveBeenCalledTimes(2);
  });

  // `preload()` finds the page by the rule of `defineAsyncComponent`.
  test.each([
    ['a real import()', () => import('./fixtures/lazy-page')],
    ['an object marked as a module', () => Promise.resolve(moduleOf(Loaded))],
    [
      'the component itself',
      () => Promise.resolve(Loaded) as unknown as Promise<LazyModule>,
    ],
  ])('preload takes the page from %s', async (_, importer) => {
    const lazyView = createLazyRouteView({
      route: createRoute(),
      view: importer,
    });

    await lazyView.preload();

    expect(mount(lazyView.view).text()).toBe('loaded');
  });

  test('preload rejects when the loader throws', async () => {
    const lazyView = createLazyRouteView({
      route: createRoute(),
      view: () => {
        throw new Error('no loader');
      },
    });

    await expect(lazyView.preload()).rejects.toThrow('no loader');
  });

  test('createLazyRouteView returns a route view with preload', () => {
    expectTypeOf(createLazyRouteView).returns.toEqualTypeOf<LazyRouteView>();
    expectTypeOf<LazyRouteView>().toMatchTypeOf<RouteView>();
    expectTypeOf<LazyRouteView['preload']>().toEqualTypeOf<
      () => Promise<void>
    >();
  });
});

describe('view name', () => {
  // The layout caches only the view named `CachedPage`. `plain` is declared
  // last, so it wins while both routes are opened.
  async function switchTwice(
    createCached: (route: RouteView['route']) => RouteView,
  ) {
    const cached = createRoute();
    const plain = createRoute();
    const scope = fork();
    const Layout = defineComponent({
      setup(_, { slots }) {
        return () =>
          h(KeepAlive, { include: 'CachedPage' }, () => slots.default?.());
      },
    });
    const RoutesView = createRoutesView({
      routes: withLayout(Layout, [
        createCached(cached),
        createRouteView({ route: plain, view: text('plain') }),
      ]),
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(cached.open, { scope, params: undefined });
    await flushPromises();
    for (let i = 0; i < 2; i++) {
      await allSettled(plain.open, { scope, params: undefined });
      await flushPromises();
      expect(wrapper.text()).toBe('plain');
      await allSettled(plain.close, { scope });
      await flushPromises();
    }

    return wrapper;
  }

  test('KeepAlive include matches a lazy view by name before the chunk loads', async () => {
    let fallbackMounts = 0;
    const CountedFallback = defineComponent({
      setup() {
        onMounted(() => {
          fallbackMounts += 1;
        });

        return () => h('p', 'loading');
      },
    });
    const wrapper = await switchTwice((route) =>
      createLazyRouteView({
        route,
        // The chunk never loads in this test.
        view: () => deferred().promise,
        fallback: CountedFallback,
        name: 'CachedPage',
      }),
    );

    expect(wrapper.text()).toBe('loading');
    // Without the cache the fallback mounts on every return to the view.
    expect(fallbackMounts).toBe(1);
  });

  test('createRouteView name is matched by KeepAlive include', async () => {
    let mounts = 0;
    const wrapper = await switchTwice((route) =>
      createRouteView({
        route,
        // A component without a name of its own.
        view: defineComponent({
          setup() {
            onMounted(() => {
              mounts += 1;
            });

            return () => h('p', 'cached');
          },
        }),
        name: 'CachedPage',
      }),
    );

    expect(wrapper.text()).toBe('cached');
    expect(mounts).toBe(1);
  });
});
