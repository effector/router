import { allSettled, fork } from 'effector';
import { inspectGraph } from 'effector/inspect';
import { createRoute, createRouter } from '@effector/router';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import {
  defineComponent,
  h,
  KeepAlive,
  onMounted,
  onUnmounted,
  type Component,
  type FunctionalComponent,
} from 'vue';
import { createRouteView, createRoutesView, Outlet, withLayout } from '../lib';
import { mountRoutes } from './helpers';

const page = (name: string) =>
  defineComponent({ render: () => h('div', [`${name}:`, h(Outlet)]) });
const leaf = (name: string) =>
  defineComponent({ render: () => h('span', name) });

function createCountedLayout() {
  const counters = { mounts: 0, unmounts: 0 };
  const Layout = defineComponent({
    setup(_, { slots }) {
      onMounted(() => {
        counters.mounts += 1;
      });
      onUnmounted(() => {
        counters.unmounts += 1;
      });
      return () => h('section', slots.default?.());
    },
  });

  return { Layout, counters };
}

describe('route view hosts', () => {
  // Before the fix the first group of a module and the view at index 1 had
  // one key. Keep this test first: only then it fails on the old renderer.
  test('a route view next to a group never reuses the group instance', async () => {
    const grouped = createRoute();
    const groupedChild = createRoute();
    const plain = createRoute();
    const plainChild = createRoute();
    const scope = fork();
    const { Layout, counters } = createCountedLayout();
    const RoutesView = createRoutesView({
      routes: [
        ...withLayout(Layout, [
          createRouteView({
            route: grouped,
            view: page('grouped'),
            children: [
              createRouteView({ route: groupedChild, view: leaf('a') }),
            ],
          }),
        ]),
        createRouteView({
          route: plain,
          view: page('plain'),
          children: [createRouteView({ route: plainChild, view: leaf('b') })],
        }),
      ],
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(grouped.open, { scope, params: undefined });
    await allSettled(groupedChild.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toBe('grouped:a');

    await allSettled(plain.open, { scope, params: undefined });
    await allSettled(plainChild.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toBe('plain:b');
    expect(counters.unmounts).toBe(1);
  });

  // The regression test of PR #126.
  test('outlet of a grouped sibling renders its own children', async () => {
    const first = createRoute();
    const firstChild = createRoute();
    const second = createRoute();
    const secondChild = createRoute();
    const scope = fork();
    const { Layout, counters } = createCountedLayout();
    const RoutesView = createRoutesView({
      routes: withLayout(Layout, [
        createRouteView({
          route: first,
          view: page('first'),
          children: [createRouteView({ route: firstChild, view: leaf('a') })],
        }),
        createRouteView({
          route: second,
          view: page('second'),
          children: [createRouteView({ route: secondChild, view: leaf('b') })],
        }),
      ]),
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(first.open, { scope, params: undefined });
    await allSettled(firstChild.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toBe('first:a');

    await allSettled(second.open, { scope, params: undefined });
    await allSettled(secondChild.open, { scope, params: undefined });
    await flushPromises();
    expect(counters.mounts).toBe(1);
    expect(wrapper.text()).toBe('second:b');
  });

  test('grouped siblings that share one page component get their own children', async () => {
    const first = createRoute();
    const firstChild = createRoute();
    const second = createRoute();
    const secondChild = createRoute();
    const scope = fork();
    const { Layout, counters } = createCountedLayout();
    let pageMounts = 0;
    const Shared = defineComponent({
      setup() {
        onMounted(() => {
          pageMounts += 1;
        });
        return () => h('div', ['shared:', h(Outlet)]);
      },
    });
    const RoutesView = createRoutesView({
      routes: withLayout(Layout, [
        createRouteView({
          route: first,
          view: Shared,
          children: [createRouteView({ route: firstChild, view: leaf('a') })],
        }),
        createRouteView({
          route: second,
          view: Shared,
          children: [createRouteView({ route: secondChild, view: leaf('b') })],
        }),
      ]),
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(first.open, { scope, params: undefined });
    await allSettled(firstChild.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toBe('shared:a');

    await allSettled(second.open, { scope, params: undefined });
    await allSettled(secondChild.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toBe('shared:b');
    expect(counters.mounts).toBe(1);
    // Each view has its own host, so the shared page mounts again.
    expect(pageMounts).toBe(2);
  });

  test('a group layout under Outlet stays mounted while its pages switch', async () => {
    const parent = createRoute();
    const first = createRoute();
    const second = createRoute();
    const scope = fork();
    const { Layout, counters } = createCountedLayout();
    const RoutesView = createRoutesView({
      routes: [
        createRouteView({
          route: parent,
          view: page('parent'),
          children: withLayout(Layout, [
            createRouteView({ route: first, view: leaf('first') }),
            createRouteView({ route: second, view: leaf('second') }),
          ]),
        }),
      ],
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(parent.open, { scope, params: undefined });
    await allSettled(first.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toBe('parent:first');

    await allSettled(second.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.text()).toBe('parent:second');
    expect(counters.mounts).toBe(1);
    expect(counters.unmounts).toBe(0);
  });

  test('an Outlet in a group layout under an Outlet does not recurse', async () => {
    const parent = createRoute();
    const child = createRoute();
    const scope = fork();
    const Layout = defineComponent({
      setup(_, { slots }) {
        return () => h('section', ['layout:', slots.default?.(), h(Outlet)]);
      },
    });
    const RoutesView = createRoutesView({
      routes: [
        createRouteView({
          route: parent,
          view: page('parent'),
          children: withLayout(Layout, [
            createRouteView({ route: child, view: leaf('child') }),
          ]),
        }),
      ],
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    await allSettled(parent.open, { scope, params: undefined });
    await allSettled(child.open, { scope, params: undefined });
    await flushPromises();

    // The Outlet of the layout has no views of its own and renders nothing.
    expect(wrapper.text()).toBe('parent:layout:child');
  });

  test('KeepAlive in a layout matches a page by its name', async () => {
    const cached = createRoute();
    const plain = createRoute();
    const scope = fork();
    const mounts = { cached: 0, plain: 0 };
    const counted = (name: 'cached' | 'plain', componentName: string) =>
      defineComponent({
        name: componentName,
        setup() {
          onMounted(() => {
            mounts[name] += 1;
          });
          return () => h('p', name);
        },
      });
    // The default slot of a group layout yields the host of the page.
    const Layout = defineComponent({
      setup(_, { slots }) {
        return () =>
          h(KeepAlive, { include: 'CachedPage' }, () => slots.default?.());
      },
    });
    const RoutesView = createRoutesView({
      routes: withLayout(Layout, [
        createRouteView({
          route: cached,
          view: counted('cached', 'CachedPage'),
        }),
        createRouteView({ route: plain, view: counted('plain', 'PlainPage') }),
      ]),
    });
    const wrapper = mountRoutes(
      createRouter({ routes: [] }),
      scope,
      RoutesView,
    );

    // `plain` is declared last, so it wins while both routes are opened.
    await allSettled(cached.open, { scope, params: undefined });
    await flushPromises();
    for (let i = 0; i < 2; i++) {
      await allSettled(plain.open, { scope, params: undefined });
      await flushPromises();
      expect(wrapper.text()).toBe('plain');
      await allSettled(plain.close, { scope });
      await flushPromises();
      expect(wrapper.text()).toBe('cached');
    }

    expect(mounts).toEqual({ cached: 1, plain: 2 });
  });

  // A `<script setup>` SFC has `__name` and no `name`, and a functional
  // component is named through `displayName`.
  test.each(['__name', 'displayName'] as const)(
    'KeepAlive in a layout matches a page by its %s',
    async (field) => {
      const cached = createRoute();
      const plain = createRoute();
      const scope = fork();
      let mounts = 0;
      const Inner = defineComponent({
        setup() {
          onMounted(() => {
            mounts += 1;
          });
          return () => h('p', 'cached');
        },
      });
      const sfc: Component = { __name: 'CachedPage', render: () => h(Inner) };
      const functional: FunctionalComponent = () => h(Inner);
      functional.displayName = 'CachedPage';
      const Layout = defineComponent({
        setup(_, { slots }) {
          return () =>
            h(KeepAlive, { include: 'CachedPage' }, () => slots.default?.());
        },
      });
      const RoutesView = createRoutesView({
        routes: withLayout(Layout, [
          createRouteView({
            route: cached,
            view: field === '__name' ? sfc : functional,
          }),
          createRouteView({ route: plain, view: leaf('plain') }),
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
        expect(wrapper.text()).toBe('cached');
      }

      expect(mounts).toBe(1);
    },
  );

  test('creates no stores when an outlet mounts', async () => {
    const parent = createRoute();
    const child = createRoute();
    const scope = fork();
    const router = createRouter({ routes: [] });
    const RoutesView = createRoutesView({
      routes: [
        createRouteView({
          route: parent,
          view: page('parent'),
          children: [createRouteView({ route: child, view: leaf('child') })],
        }),
      ],
    });

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
      const wrapper = mountRoutes(router, scope, RoutesView);
      expect(wrapper.text()).toBe('parent:child');
      wrapper.unmount();
    }
    inspection.unsubscribe();

    expect(stores).toEqual([]);
  });
});
