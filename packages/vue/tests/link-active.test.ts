import { allSettled, fork } from 'effector';
import {
  createRoute,
  createRouter,
  historyAdapter,
  type PathRoute,
} from '@effector/router';
import { flushPromises } from '@vue/test-utils';
import { EffectorScopePlugin } from 'effector-vue/composition';
import { createMemoryHistory } from 'history';
import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import { createSSRApp, h, type VNode } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createRouterPlugin, Link, type LinkSlotProps } from '../lib';
import { mountRoutes } from './helpers';

async function createApp(routes: PathRoute<any>[], initial: string) {
  const scope = fork();
  const router = createRouter({ routes });
  const history = createMemoryHistory({ initialEntries: [initial] });

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(history),
  });

  const go = async (path: string) => {
    await allSettled(router.navigate, { scope, params: { path } });
    await flushPromises();
  };

  return { scope, router, history, go };
}

// Both class props on every link, so one attribute shows the whole state.
const state = { activeClass: 'active', exactActiveClass: 'exact' };

describe('Link active state', () => {
  test('active and exact active classes follow the params of the link', async () => {
    const user = createRoute({ path: '/users/:id' });
    const { scope, router, go } = await createApp([user], '/users/1');
    const wrapper = mountRoutes(router, scope, () => [
      h(Link, { to: user, params: { id: '1' }, id: 'first', ...state }),
      h(Link, { to: user, params: { id: '2' }, id: 'second', ...state }),
    ]);
    const classes = () => [
      wrapper.find('#first').attributes('class'),
      wrapper.find('#second').attributes('class'),
    ];

    expect(classes()).toEqual(['active exact', undefined]);
    expect(wrapper.find('#first').attributes('aria-current')).toBe('page');
    expect(wrapper.find('#second').attributes('aria-current')).toBeUndefined();

    await go('/users/2');

    expect(classes()).toEqual([undefined, 'active exact']);
    expect(wrapper.find('#first').attributes('aria-current')).toBeUndefined();
    expect(wrapper.find('#second').attributes('aria-current')).toBe('page');
  });

  test('a link to a route of the parent chain is active and not exact', async () => {
    const profile = createRoute({ path: '/profile/:id' });
    const tab = createRoute({ path: '/:tab', parent: profile });
    const details = createRoute({ path: '/details', parent: tab });
    const { scope, router } = await createApp(
      [profile, tab, details],
      '/profile/1/posts/details',
    );
    const wrapper = mountRoutes(router, scope, () => [
      h(Link, { to: profile, params: { id: '1' }, id: 'root', ...state }),
      h(Link, {
        to: tab,
        params: { id: '1', tab: 'posts' },
        id: 'middle',
        ...state,
      }),
      h(Link, {
        to: tab,
        params: { id: '2', tab: 'posts' },
        id: 'other',
        ...state,
      }),
      h(Link, {
        to: details,
        params: { id: '1', tab: 'posts' },
        id: 'leaf',
        ...state,
      }),
    ]);
    const link = (id: string) => wrapper.find(`#${id}`).attributes();

    expect(link('root').class).toBe('active');
    expect(link('middle').class).toBe('active');
    expect(link('other').class).toBeUndefined();
    expect(link('leaf').class).toBe('active exact');
    expect(link('root')['aria-current']).toBeUndefined();
    expect(link('leaf')['aria-current']).toBe('page');
  });

  test('a malformed percent sequence in the path does not break the render', async () => {
    const user = createRoute({ path: '/users/:name' });
    const { scope, router } = await createApp([user], '/users/%E0%A4%A');
    const wrapper = mountRoutes(router, scope, () => [
      h(Link, { to: user, params: { name: '%E0%A4%A' }, id: 'same', ...state }),
      h(Link, { to: user, params: { name: 'x' }, id: 'other', ...state }),
    ]);

    expect(wrapper.find('#same').attributes('class')).toBe('active exact');
    expect(wrapper.find('#other').attributes('class')).toBeUndefined();
  });

  test('active classes are added to the class of the link', async () => {
    const home = createRoute({ path: '/home' });
    const about = createRoute({ path: '/about' });
    const { scope, router, go } = await createApp([home, about], '/home');
    const wrapper = mountRoutes(router, scope, () =>
      h(Link, { to: home, class: ['nav', { wide: true }], ...state }),
    );

    expect(wrapper.find('a').attributes('class')).toBe('nav wide active exact');

    await go('/about');
    expect(wrapper.find('a').attributes('class')).toBe('nav wide');
  });

  test('the slot receives href, isActive, isExactActive and navigate', async () => {
    const home = createRoute({ path: '/home' });
    const user = createRoute({ path: '/users/:id' });
    const { scope, router, history } = await createApp([home, user], '/home');
    const seen: LinkSlotProps[] = [];
    const wrapper = mountRoutes(router, scope, () =>
      h(
        Link,
        { to: user, params: { id: '1' }, query: { tab: 'a' }, replace: true },
        {
          default: (props: LinkSlotProps) => {
            seen.push(props);

            return h('button', { onClick: props.navigate }, 'open');
          },
        },
      ),
    );
    const index = history.index;

    expect(seen.at(-1)).toEqual({
      href: '/users/1?tab=a',
      isActive: false,
      isExactActive: false,
      navigate: expect.any(Function),
    });

    // The click reaches the anchor of the link as well. `navigate` has
    // prevented it by then, so the route opens once.
    const opened = vi.fn();
    const unwatch = user.opened.watch(opened);

    await wrapper.find('button').trigger('click');
    await allSettled(scope);
    await flushPromises();
    unwatch();

    expect(opened).toHaveBeenCalledTimes(1);
    expect(history.location.pathname).toBe('/users/1');
    // `replace` of the link: the history did not grow.
    expect(history.index).toBe(index);
    expect(seen.at(-1)).toMatchObject({ isActive: true, isExactActive: true });
  });

  test('a 0.1.0 style link renders the same markup, plus aria-current on an exact match', async () => {
    const home = createRoute({ path: '/home' });
    const about = createRoute({ path: '/about' });
    const { scope, router, go } = await createApp([home, about], '/about');
    const wrapper = mountRoutes(router, scope, () =>
      h(
        Link,
        { to: home, id: 'home', class: 'nav', rel: 'prev' },
        () => 'Home',
      ),
    );

    expect(wrapper.html()).toBe(
      '<a id="home" class="nav" rel="prev" href="/home">Home</a>',
    );

    await go('/home');

    expect(wrapper.find('a').attributes()).toEqual({
      id: 'home',
      class: 'nav',
      rel: 'prev',
      href: '/home',
      'aria-current': 'page',
    });
  });

  test('aria-current passed to the link wins', async () => {
    const home = createRoute({ path: '/home' });
    const { scope, router } = await createApp([home], '/home');
    const wrapper = mountRoutes(router, scope, () => [
      h(Link, { to: home, id: 'step', 'aria-current': 'step' }),
      h(Link, { to: home, id: 'none', 'aria-current': undefined }),
    ]);

    expect(wrapper.find('#step').attributes('aria-current')).toBe('step');
    expect(wrapper.find('#none').attributes('aria-current')).toBeUndefined();
  });

  test('a link without classes renders no class attribute', async () => {
    const home = createRoute({ path: '/home' });
    const about = createRoute({ path: '/about' });
    const { scope, router } = await createApp([home, about], '/home');
    const links = () => [
      // Active, no class props.
      h(Link, { to: home }, () => 'home'),
      // Class props, not active.
      h(Link, { to: about, ...state }, () => 'about'),
    ];
    const wrapper = mountRoutes(router, scope, links);
    const html = await renderToString(
      createSSRApp({ render: links })
        .use(EffectorScopePlugin({ scope }))
        .use(createRouterPlugin({ router })),
    );

    expect(wrapper.html()).not.toContain('class');
    expect(html).toBe(
      '<!--[--><a aria-current="page" href="/home">home</a><a href="/about">about</a><!--]-->',
    );
  });
});

// `h()` types its children loosely and cannot check slot props, so the slot
// is read from `$slots`, where templates and TSX take it.
test('Link declares the default slot', () => {
  type LinkSlots = InstanceType<typeof Link>['$slots'];

  expectTypeOf<LinkSlots['default']>().toEqualTypeOf<
    ((props: LinkSlotProps) => VNode[]) | undefined
  >();
  expectTypeOf<LinkSlotProps>().toEqualTypeOf<{
    href: string;
    isActive: boolean;
    isExactActive: boolean;
    navigate: (event?: MouseEvent) => void;
  }>();
});
