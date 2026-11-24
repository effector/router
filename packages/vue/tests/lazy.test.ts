import { createRoute } from '@effector/router';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, onMounted, Suspense, type Component } from 'vue';
import { createLazyRouteView } from '../lib';

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
