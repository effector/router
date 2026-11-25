import { allSettled, fork } from 'effector';
import {
  createRoute,
  createRouter,
  historyAdapter,
  type Route,
} from '@effector/router';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory } from 'history';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { Link, RouterProvider, useLink } from '../lib';
import { mountRoutes } from './helpers';

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

describe('Link with merged click listeners', () => {
  async function setup() {
    const home = createRoute({ path: '/home' });
    const target = createRoute({ path: '/target' });
    const scope = fork();
    const router = createRouter({ routes: [home, target] });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(
        createMemoryHistory({ initialEntries: ['/home'] }),
      ),
    });

    return { target, scope, router };
  }

  // The root of the wrapper is Link, so the `onClick` of the parent falls
  // through to it and Vue merges it with the wrapper's own listener.
  function createWrapper(
    target: Route<void>,
    own: (event: MouseEvent) => void,
  ) {
    return defineComponent({
      setup: () => () =>
        h(Link, { to: target, id: 'link', onClick: own }, () => 'go'),
    });
  }

  test('runs the click listeners of a wrapper and of its parent', async () => {
    const { target, scope, router } = await setup();
    const own = vi.fn();
    const outer = vi.fn();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnings = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Wrapper = createWrapper(target, own);
    const wrapper = mountRoutes(router, scope, () =>
      h(Wrapper, { onClick: outer }),
    );
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    wrapper.find('#link').element.dispatchEvent(click);
    await allSettled(scope);
    await flushPromises();

    expect(own).toHaveBeenCalledTimes(1);
    expect(outer).toHaveBeenCalledTimes(1);
    // Link took the click over: without it the browser loads the page.
    expect(click.defaultPrevented).toBe(true);
    expect(scope.getState(target.$isOpened)).toBe(true);
    expect(errors).not.toHaveBeenCalled();
    expect(warnings).not.toHaveBeenCalled();

    errors.mockRestore();
    warnings.mockRestore();
  });

  test('runs listeners from a nested array', async () => {
    const { target, scope, router } = await setup();
    const first = vi.fn();
    const second = vi.fn();
    const third = vi.fn();
    const wrapper = mountRoutes(router, scope, () =>
      h(Link, {
        to: target,
        id: 'link',
        onClick: [first, [second, third]] as unknown as () => void,
      }),
    );

    await wrapper.find('#link').trigger('click');
    await allSettled(scope);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(third).toHaveBeenCalledTimes(1);
    expect(scope.getState(target.$isOpened)).toBe(true);
  });

  // The wrapper's own listener comes first in the merged array.
  test('stopImmediatePropagation in a listener skips the listeners after it', async () => {
    const { target, scope, router } = await setup();
    const outer = vi.fn();
    const Wrapper = createWrapper(target, (event) =>
      event.stopImmediatePropagation(),
    );
    const wrapper = mountRoutes(router, scope, () =>
      h(Wrapper, { onClick: outer }),
    );
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });

    wrapper.find('#link').element.dispatchEvent(click);
    await allSettled(scope);
    await flushPromises();

    expect(outer).not.toHaveBeenCalled();
    // Only `preventDefault` cancels navigation.
    expect(click.defaultPrevented).toBe(true);
    expect(scope.getState(target.$isOpened)).toBe(true);
  });

  test.each(['wrapper', 'parent'] as const)(
    'preventDefault in the %s listener cancels navigation',
    async (place) => {
      const { target, scope, router } = await setup();
      const prevent = (event: MouseEvent) => event.preventDefault();
      const pass = vi.fn();
      const Wrapper = createWrapper(
        target,
        place === 'wrapper' ? prevent : pass,
      );
      const wrapper = mountRoutes(router, scope, () =>
        h(Wrapper, { onClick: place === 'parent' ? prevent : pass }),
      );

      await wrapper.find('#link').trigger('click');
      await allSettled(scope);
      await flushPromises();

      expect(pass).toHaveBeenCalledTimes(1);
      expect(scope.getState(target.$isOpened)).toBe(false);
    },
  );
});
