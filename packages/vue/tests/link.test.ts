import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory } from 'history';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { Link, RouterProvider, useLink } from '../lib';

describe('useLink', () => {
  test('useLink throws in setup for a route outside the router', () => {
    const known = createRoute({ path: '/known' });
    const outside = createRoute({ path: '/outside' });
    const router = createRouter({ routes: [known] });
    // Vue reports the setup error through `console.warn` and throws it again.
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Probe = defineComponent({
      setup() {
        useLink(outside);

        return () => null;
      },
    });

    expect(() =>
      mount(RouterProvider, {
        props: { router },
        slots: { default: () => h(Probe) },
      }),
    ).toThrow('[useLink] Route not found');

    warnings.mockRestore();
  });
});

describe('Link', () => {
  test('opens the route without EffectorScopePlugin', async () => {
    // No scope here: the routes live in the global state, so they are created
    // inside the test and used nowhere else.
    const home = createRoute({ path: '/home' });
    const target = createRoute({ path: '/target/:id' });
    const router = createRouter({ routes: [home, target] });
    const history = createMemoryHistory({ initialEntries: ['/home'] });

    router.setHistory(historyAdapter(history));
    await vi.waitFor(() => expect(home.$isOpened.getState()).toBe(true));

    const wrapper = mount(RouterProvider, {
      props: { router },
      slots: {
        default: () =>
          h(Link, { to: target, params: { id: '7' }, id: 'link' }, () => 'go'),
      },
    });

    expect(wrapper.find('#link').attributes('href')).toBe('/target/7');

    await wrapper.find('#link').trigger('click');
    await flushPromises();
    await vi.waitFor(() => expect(target.$isOpened.getState()).toBe(true));

    expect(target.$params.getState()).toStrictEqual({ id: '7' });
    expect(history.location.pathname).toBe('/target/7');
  });
});
