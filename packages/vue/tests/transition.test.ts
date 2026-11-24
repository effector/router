// The facts that docs/how-to/vue-keep-alive-and-transition.md states about
// `Transition` and a navigation by path.
import { allSettled, fork } from 'effector';
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { flushPromises } from '@vue/test-utils';
import { createMemoryHistory } from 'history';
import { describe, expect, test } from 'vitest';
import {
  defineComponent,
  h,
  KeepAlive,
  ref,
  Transition,
  type TransitionProps,
} from 'vue';
import { createRouteView, createRoutesView, Outlet } from '../lib';
import { mountRoutes } from './helpers';

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// A page with local state: the button adds one to the number it shows.
const counterPage = (name: string) =>
  defineComponent({
    setup() {
      const count = ref(0);

      return () =>
        h('button', { onClick: () => (count.value += 1) }, [
          `${name}:${count.value}`,
        ]);
    },
  });

// The hooks of a transition whose phases last 20 ms, far longer than a
// navigation. `left` marks the end of a leave.
const hooks = (log: string[]) => ({
  onLeave: (el: Element, done: () => void) => {
    log.push(`leave ${el.textContent}`);
    setTimeout(done, 20);
  },
  onAfterLeave: (el: Element) => {
    log.push(`left ${el.textContent}`);
  },
  onEnter: (el: Element, done: () => void) => {
    log.push(`enter ${el.textContent}`);
    setTimeout(done, 20);
  },
});
const transition = (inner: string) => `
  <Transition
    :mode="mode"
    :css="false"
    @leave="onLeave"
    @after-leave="onAfterLeave"
    @enter="onEnter"
  >
    ${inner}
  </Transition>
`;

// Two path routes in one routes view, the view wrapped in `Transition` the
// way the how-to page writes it.
async function setup(
  mode: TransitionProps['mode'],
  inner: string,
  withOtherwise = true,
) {
  const a = createRoute({ path: '/a' });
  const b = createRoute({ path: '/b' });
  const scope = fork();
  const router = createRouter({ routes: [a, b] });
  const log: string[] = [];

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(createMemoryHistory({ initialEntries: ['/a'] })),
  });

  const RoutesView = createRoutesView({
    routes: [
      createRouteView({ route: a, view: counterPage('a') }),
      createRouteView({ route: b, view: counterPage('b') }),
    ],
    otherwise: withOtherwise
      ? defineComponent({ render: () => h('p', 'otherwise') })
      : undefined,
  });
  const App = defineComponent({
    components: { RoutesView, Transition, KeepAlive },
    setup: () => ({ mode, ...hooks(log) }),
    template: `
      <RoutesView v-slot="{ Component }">${transition(inner)}</RoutesView>
    `,
  });
  // @vue/test-utils replaces Transition by a stub unless told otherwise.
  const wrapper = mountRoutes(router, scope, App, {
    stubs: { transition: false },
  });
  const go = async (path: string) => {
    await allSettled(router.navigate, { scope, params: { path } });
    await flushPromises();
    await delay(100);
  };

  await flushPromises();
  log.length = 0;

  return { wrapper, log, go };
}

// A parent route with two child routes. The page of the parent wraps the
// view of its `Outlet` in `Transition` with `mode="out-in"`.
async function setupOutlet(inner: string) {
  const parent = createRoute({ path: '/p' });
  const first = createRoute({ path: '/c1', parent });
  const second = createRoute({ path: '/c2', parent });
  const scope = fork();
  const router = createRouter({ routes: [parent, first, second] });
  const log: string[] = [];

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(createMemoryHistory({ initialEntries: ['/p/c1'] })),
  });

  const Parent = defineComponent({
    components: { Outlet, Transition },
    setup: () => ({ mode: 'out-in', ...hooks(log) }),
    template: `<Outlet v-slot="{ Component }">${transition(inner)}</Outlet>`,
  });
  const RoutesView = createRoutesView({
    routes: [
      createRouteView({
        route: parent,
        view: Parent,
        children: [
          createRouteView({ route: first, view: counterPage('c1') }),
          createRouteView({ route: second, view: counterPage('c2') }),
        ],
      }),
    ],
  });
  const wrapper = mountRoutes(router, scope, RoutesView, {
    stubs: { transition: false },
  });

  await flushPromises();
  log.length = 0;

  await allSettled(router.navigate, { scope, params: { path: '/p/c2' } });
  await flushPromises();
  await delay(100);

  return { wrapper, log };
}

const page = '<component :is="Component" />';
// An element in place of the missing view. See "Nested views" on the how-to
// page.
const pageOrPlaceholder =
  '<component :is="Component" v-if="Component" /><i v-else />';

describe('Transition around the view of RoutesView', () => {
  test('mode out-in: the next page enters after the previous one left, otherwise does not appear', async () => {
    const { wrapper, log, go } = await setup('out-in', page);

    await go('/b');

    expect(log).toEqual(['leave a:0', 'left a:0', 'enter b:0']);
    expect(wrapper.text()).toBe('b:0');
  });

  // The first route closes before the second opens, and the routes view
  // renders `otherwise` in between.
  test('default mode: otherwise enters and leaves between two path routes (current behavior)', async () => {
    const { wrapper, log, go } = await setup(undefined, page);

    await go('/b');

    expect(log).toEqual([
      'leave a:0',
      'enter otherwise',
      'leave otherwise',
      'enter b:0',
      'left a:0',
      'left otherwise',
    ]);
    expect(wrapper.text()).toBe('b:0');
  });

  test('Transition with KeepAlive inside keeps the state of a page', async () => {
    const { wrapper, log, go } = await setup(
      'out-in',
      `<KeepAlive>${page}</KeepAlive>`,
    );

    await wrapper.find('button').trigger('click');
    await go('/b');
    await go('/a');

    expect(log).toEqual([
      'leave a:1',
      'left a:1',
      'enter b:0',
      'leave b:0',
      'left b:0',
      'enter a:1',
    ]);
    expect(wrapper.text()).toBe('a:1');
  });

  // Without `otherwise` the slot receives `null` between the two routes. Vue
  // renders a comment for it, and `out-in` does not wait when one side of the
  // change is a comment.
  test('mode out-in without otherwise: the next page enters before the previous one left (current behavior)', async () => {
    const { wrapper, log, go } = await setup('out-in', page, false);

    await go('/b');

    expect(log).toEqual(['leave a:0', 'enter b:0', 'left a:0']);
    expect(wrapper.text()).toBe('b:0');
  });
});

// `Outlet` has no `otherwise`.
describe('Transition around the view of Outlet', () => {
  test('mode out-in: the next view enters before the previous one left (current behavior)', async () => {
    const { wrapper, log } = await setupOutlet(page);

    expect(log).toEqual(['leave c1:0', 'enter c2:0', 'left c1:0']);
    expect(wrapper.text()).toBe('c2:0');
  });

  test('mode out-in with an element in place of the missing view: the next view enters after the previous one left', async () => {
    const { wrapper, log } = await setupOutlet(pageOrPlaceholder);

    expect(log).toEqual(['leave c1:0', 'left c1:0', 'enter c2:0']);
    expect(wrapper.text()).toBe('c2:0');
  });
});
