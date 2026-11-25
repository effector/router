import { allSettled, createEffect, fork, type Scope } from 'effector';
import { inspectGraph } from 'effector/inspect';
import {
  createRoute,
  createRouter,
  historyAdapter,
  type PathRoute,
  type Route,
  type Router,
} from '@effector/router';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory } from 'history';
import { describe, expect, test, vi } from 'vitest';
import { defineComponent, h, ref, shallowRef } from 'vue';
import {
  RouterProvider,
  useIsOpened,
  useLink,
  type UseLinkReturn,
} from '../lib';
import { mountRoutes } from './helpers';

// Sum of the subscriptions `useUnit` keeps in the scope.
function countScopeLinks(scope: Scope): number {
  const { additionalLinks } = scope as unknown as {
    additionalLinks: Record<string, unknown[]>;
  };

  return Object.values(additionalLinks).reduce(
    (sum, list) => sum + list.length,
    0,
  );
}

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

// Runs a composable in a component and hands out its result.
function run<Result>(router: Router, scope: Scope, composable: () => Result) {
  let result!: Result;
  const wrapper = mountRoutes(
    router,
    scope,
    defineComponent({
      setup() {
        result = composable();

        return () => null;
      },
    }),
  );

  return { result, wrapper };
}

// `[isActive, isExactActive]` of every link of an object.
function activeState(links: Record<string, UseLinkReturn<any>>) {
  return Object.fromEntries(
    Object.entries(links).map(([name, link]) => [
      name,
      [link.isActive.value, link.isExactActive.value],
    ]),
  );
}

describe('useLink with refs and getters', () => {
  test('a getter that switches the route switches href, onOpen and the state', async () => {
    const home = createRoute({ path: '/home' });
    const about = createRoute({ path: '/about' });
    const { scope, router, history } = await createApp([home, about], '/home');
    const to = shallowRef<Route<void>>(home);
    const { result: link } = run(router, scope, () => useLink(() => to.value));

    expect(link.href.value).toBe('/home');
    expect(link.isActive.value).toBe(true);

    to.value = about;

    // Read in the same tick: nothing waits for a flush.
    expect(link.href.value).toBe('/about');
    expect(link.build()).toBe('/about');
    expect(link.isActive.value).toBe(false);

    link.onOpen();
    await allSettled(scope);

    expect(history.location.pathname).toBe('/about');
    expect(link.isActive.value).toBe(true);
    expect(link.isExactActive.value).toBe(true);
  });

  test('href follows params and query given as a ref and a getter', async () => {
    const home = createRoute({ path: '/home' });
    const user = createRoute({ path: '/users/:id' });
    const { scope, router } = await createApp([home, user], '/home?page=2');
    const params = ref({ id: '1' });
    const tab = ref<string | undefined>();
    const { result: link } = run(router, scope, () =>
      useLink(user, params, () => (tab.value ? { tab: tab.value } : undefined)),
    );

    // An omitted query keeps the query of the router.
    expect(link.href.value).toBe('/users/1?page=2');

    params.value = { id: '2' };
    tab.value = 'posts';

    expect(link.href.value).toBe('/users/2?tab=posts');
  });

  test('build() throws on every call after the route leaves the router', async () => {
    const home = createRoute({ path: '/home' });
    const outside = createRoute({ path: '/outside' });
    const { scope, router } = await createApp([home], '/home');
    const to = shallowRef<Route<void>>(home);
    const { result: link } = run(router, scope, () => useLink(to));

    expect(link.build()).toBe('/home');

    to.value = outside;

    expect(() => link.build()).toThrow('[useLink] Route not found');
    expect(() => link.build()).toThrow('[useLink] Route not found');
    expect(() => link.navigate()).toThrow('[useLink] Route not found');
    expect(() => link.href.value).toThrow('[useLink] Route not found');
    expect(activeState({ link })).toEqual({ link: [false, false] });
  });

  test('href throws on every read while a required param is missing', async () => {
    const user = createRoute({ path: '/users/:id' });
    const { scope, router } = await createApp([user], '/users/1');
    const params = shallowRef<{ id: string } | undefined>({ id: '1' });
    const { result: link } = run(router, scope, () => useLink(user, params));

    expect(link.href.value).toBe('/users/1');

    params.value = undefined;

    expect(() => link.href.value).toThrow('Parameter "id" expects a value');
    expect(() => link.href.value).toThrow('Parameter "id" expects a value');

    params.value = { id: '2' };

    expect(link.href.value).toBe('/users/2');
  });

  test('works without EffectorScopePlugin', async () => {
    // No scope here: the routes live in the global state, so they are created
    // inside the test and used nowhere else.
    const home = createRoute({ path: '/home' });
    const about = createRoute({ path: '/about' });
    const router = createRouter({ routes: [home, about] });
    const history = createMemoryHistory({ initialEntries: ['/home'] });
    const to = shallowRef<Route<void>>(home);
    let link!: UseLinkReturn;

    router.setHistory(historyAdapter(history));
    await vi.waitFor(() => expect(home.$isOpened.getState()).toBe(true));

    mount(RouterProvider, {
      props: { router },
      slots: {
        default: () =>
          h(
            defineComponent({
              setup() {
                link = useLink(to);

                return () => null;
              },
            }),
          ),
      },
    });

    expect(link.isActive.value).toBe(true);

    to.value = about;
    expect(link.isActive.value).toBe(false);

    link.navigate();
    await vi.waitFor(() => expect(link.isActive.value).toBe(true));

    expect(history.location.pathname).toBe('/about');
  });

  test('creates no stores per call, per mount or per switch of the route', async () => {
    const home = createRoute({ path: '/home' });
    const about = createRoute({ path: '/about' });
    const { scope, router } = await createApp([home, about], '/home');
    const stores: string[] = [];
    const inspection = inspectGraph({
      fn: (declaration) => {
        if (declaration.type === 'unit' && declaration.kind === 'store') {
          stores.push(declaration.id);
        }
      },
    });

    for (let i = 0; i < 3; i++) {
      const to = shallowRef<Route<void>>(home);
      const { result, wrapper } = run(router, scope, () => ({
        link: useLink(to),
        plain: useLink(home),
        isOpened: useIsOpened(to),
      }));

      to.value = about;
      expect(result.link.href.value).toBe('/about');
      expect(result.plain.isActive.value).toBe(true);
      expect(result.isOpened.value).toBe(false);
      wrapper.unmount();
    }
    inspection.unsubscribe();

    expect(stores).toEqual([]);
  });
});

describe('useIsOpened with refs and getters', () => {
  test('useIsOpened follows a route that a getter switches', async () => {
    const home = createRoute({ path: '/home' });
    const about = createRoute({ path: '/about' });
    const { scope, router, go } = await createApp([home, about], '/home');
    const to = shallowRef<Route<void>>(home);
    const { result: isOpened } = run(router, scope, () =>
      useIsOpened(() => to.value),
    );

    expect(isOpened.value).toBe(true);

    to.value = about;
    expect(isOpened.value).toBe(false);

    await go('/about');
    expect(isOpened.value).toBe(true);
  });

  test('useIsOpened accepts a ref that switches between a route and a router', async () => {
    const home = createRoute({ path: '/home' });
    const about = createRoute({ path: '/about' });
    const { scope, router, go } = await createApp([home, about], '/home');
    const to = shallowRef<Route<void> | Router>(about);
    const { result: isOpened } = run(router, scope, () => useIsOpened(to));

    expect(isOpened.value).toBe(false);

    to.value = router;
    expect(isOpened.value).toBe(true);

    await go('/nowhere');
    expect(isOpened.value).toBe(false);
  });

  test('the subscription of the previous route ends when the route changes', async () => {
    const home = createRoute({ path: '/home' });
    const about = createRoute({ path: '/about' });
    const { scope, router } = await createApp([home, about], '/home');
    const to = shallowRef<Route<void>>(home);
    const before = countScopeLinks(scope);

    run(router, scope, () => useIsOpened(to));

    const mounted = countScopeLinks(scope);

    expect(mounted).toBeGreaterThan(before);

    for (const route of [about, home, about]) {
      to.value = route;
      expect(countScopeLinks(scope)).toBe(mounted);
    }
  });

  test('a route switched in the setup of another component keeps its subscription', async () => {
    const home = createRoute({ path: '/home' });
    const about = createRoute({ path: '/about' });
    const { scope, router, go } = await createApp([home, about], '/home');
    const to = shallowRef<Route<void>>(home);
    const { result: isOpened } = run(router, scope, () => useIsOpened(to));
    // The watch of `useIsOpened` runs inside the setup of this component.
    const other = run(router, scope, () => {
      to.value = about;
    });

    other.wrapper.unmount();
    await go('/about');

    expect(isOpened.value).toBe(true);
  });

  test('the subscription ends on unmount', async () => {
    const home = createRoute({ path: '/home' });
    const about = createRoute({ path: '/about' });
    const { scope, router } = await createApp([home, about], '/home');
    const to = shallowRef<Route<void>>(home);
    const before = countScopeLinks(scope);
    const { wrapper } = run(router, scope, () => ({
      isOpened: useIsOpened(to),
      link: useLink(to),
    }));

    to.value = about;
    expect(countScopeLinks(scope)).toBeGreaterThan(before);

    wrapper.unmount();
    expect(countScopeLinks(scope)).toBe(before);
  });
});

describe('useLink active state', () => {
  test('isActive follows the params of the link', async () => {
    const user = createRoute({ path: '/users/:id' });
    const { scope, router, go } = await createApp([user], '/users/1');
    const { result } = run(router, scope, () => ({
      first: useLink(user, { id: '1' }),
      second: useLink(user, { id: '2' }),
      any: useLink(user),
      extraKey: useLink(user, { id: '1', tab: 'x' } as { id: string }),
    }));

    expect(result.first.isActive.value).toBe(true);
    expect(result.first.isExactActive.value).toBe(true);
    expect(result.second.isActive.value).toBe(false);
    // Without params only the route counts.
    expect(result.any.isActive.value).toBe(true);
    // A key that the path does not have is compared as well.
    expect(result.extraKey.href.value).toBe('/users/1');
    expect(result.extraKey.isActive.value).toBe(false);

    await go('/users/2');

    expect(result.first.isActive.value).toBe(false);
    expect(result.second.isActive.value).toBe(true);
    expect(result.second.isExactActive.value).toBe(true);
  });

  test('a link without a param is active, and exactly active only with all params', async () => {
    const user = createRoute({ path: '/users/:id?' });
    const { scope, router } = await createApp([user], '/users/1');
    const { result } = run(router, scope, () => ({
      none: useLink(user),
      unset: useLink(user, { id: undefined }),
      full: useLink(user, { id: '1' }),
    }));

    expect(activeState(result)).toEqual({
      none: [true, false],
      unset: [true, false],
      full: [true, true],
    });
  });

  test('a link is not active while beforeOpen of its route is pending', async () => {
    let release!: () => void;
    const guardFx = createEffect(
      () => new Promise<void>((resolve) => (release = resolve)),
    );
    const home = createRoute({ path: '/home' });
    const guarded = createRoute({ path: '/guarded', beforeOpen: [guardFx] });
    const { scope, router } = await createApp([home, guarded], '/home');
    const { result: link } = run(router, scope, () => useLink(guarded));
    const navigation = allSettled(router.navigate, {
      scope,
      params: { path: '/guarded' },
    });

    await flushPromises();

    expect(scope.getState(router.$path)).toBe('/guarded');
    expect(activeState({ link })).toEqual({ link: [false, false] });

    release();
    await navigation;

    expect(activeState({ link })).toEqual({ link: [true, true] });
  });

  test('a link to a middle route is active while its child is opened', async () => {
    const profile = createRoute({ path: '/profile/:id' });
    const tab = createRoute({ path: '/:tab', parent: profile });
    const details = createRoute({ path: '/details', parent: tab });
    const { scope, router, go } = await createApp(
      [profile, tab, details],
      '/profile/1/posts/details',
    );
    const { result } = run(router, scope, () => ({
      root: useLink(profile, { id: '1' }),
      middle: useLink(tab, { id: '1', tab: 'posts' }),
      otherTab: useLink(tab, { id: '1', tab: 'likes' }),
      otherUser: useLink(tab, { id: '2', tab: 'posts' }),
      leaf: useLink(details, { id: '1', tab: 'posts' }),
    }));
    const state = () => activeState(result);

    expect(state()).toEqual({
      root: [true, false],
      middle: [true, false],
      otherTab: [false, false],
      otherUser: [false, false],
      leaf: [true, true],
    });

    await go('/profile/1/posts');

    expect(state()).toEqual({
      root: [true, false],
      middle: [true, true],
      otherTab: [false, false],
      otherUser: [false, false],
      leaf: [false, false],
    });
  });

  test('a link with a non-ASCII param is active on an encoded path', async () => {
    const user = createRoute({ path: '/users/:name' });
    const { scope, router } = await createApp(
      [user],
      `/users/${encodeURIComponent('Jürgen')}`,
    );
    const { result } = run(router, scope, () => ({
      plain: useLink(user, { name: 'Jürgen' }),
      encoded: useLink(user, { name: 'J%C3%BCrgen' }),
      other: useLink(user, { name: 'Jurgen' }),
    }));

    expect(scope.getState(user.$params)).toEqual({ name: 'J%C3%BCrgen' });
    expect(result.plain.isActive.value).toBe(true);
    expect(result.plain.isExactActive.value).toBe(true);
    expect(result.encoded.isActive.value).toBe(true);
    expect(result.other.isActive.value).toBe(false);
  });

  test('a malformed percent sequence in the path does not throw', async () => {
    const user = createRoute({ path: '/users/:name' });
    const { scope, router } = await createApp([user], '/users/%E0%A4%A');
    const { result } = run(router, scope, () => ({
      same: useLink(user, { name: '%E0%A4%A' }),
      other: useLink(user, { name: 'x' }),
    }));

    expect(() => decodeURIComponent('%E0%A4%A')).toThrow(URIError);
    expect(result.same.isActive.value).toBe(true);
    expect(result.same.isExactActive.value).toBe(true);
    expect(result.other.isActive.value).toBe(false);
  });

  test('number and array params are compared with the params of the URL', async () => {
    const post = createRoute({ path: '/posts/:id<number>' });
    const files = createRoute({ path: '/files/:parts+' });
    const page = createRoute({ path: '/pages/:id?' });
    const { scope, router, go } = await createApp(
      [post, files, page],
      '/posts/7',
    );
    const { result } = run(router, scope, () => ({
      post: useLink(post, { id: 7 }),
      // A number equals its string form.
      stringPost: useLink(post, { id: '7' } as unknown as { id: number }),
      otherPost: useLink(post, { id: 8 }),
      files: useLink(files, { parts: ['a', 'b'] }),
      // Arrays differ by length, by an item, and from their joined form.
      shorterFiles: useLink(files, { parts: ['a'] }),
      longerFiles: useLink(files, { parts: ['a', 'b', 'c'] }),
      otherItem: useLink(files, { parts: ['a', 'c'] }),
      joined: useLink(files, { parts: ['a,b'] }),
      // A missing param of the URL equals `undefined` and `null`.
      noPage: useLink(page, { id: undefined }),
      nullPage: useLink(page, { id: null } as unknown as { id?: string }),
    }));

    expect(activeState(result)).toMatchObject({
      post: [true, true],
      stringPost: [true, true],
      otherPost: [false, false],
    });

    await go('/files/a/b');

    expect(activeState(result)).toMatchObject({
      files: [true, true],
      shorterFiles: [false, false],
      longerFiles: [false, false],
      otherItem: [false, false],
      joined: [false, false],
    });

    await go('/pages');

    expect(activeState(result)).toMatchObject({
      noPage: [true, true],
      nullPage: [true, true],
    });
  });

  test('the query does not change the active state', async () => {
    const home = createRoute({ path: '/home' });
    const { scope, router } = await createApp([home], '/home?tab=a');
    const { result: link } = run(router, scope, () =>
      useLink(home, undefined, { tab: 'b' }),
    );

    expect(link.href.value).toBe('/home?tab=b');
    expect(link.isActive.value).toBe(true);
    expect(link.isExactActive.value).toBe(true);
  });
});

describe('useLink navigate', () => {
  async function setup() {
    const home = createRoute({ path: '/home' });
    const user = createRoute({ path: '/users/:id' });
    const app = await createApp([home, user], '/home');
    const { result: link } = run(app.router, app.scope, () =>
      useLink(user, { id: '1' }, { tab: 'posts' }),
    );
    const click = async (
      element: HTMLElement,
      init: MouseEventInit = {},
    ): Promise<MouseEvent> => {
      const event = new MouseEvent('click', { cancelable: true, ...init });

      element.addEventListener('click', link.navigate);
      element.dispatchEvent(event);
      await allSettled(app.scope);

      return event;
    };
    const anchor = (attributes: Record<string, string> = {}) => {
      const element = document.createElement('a');

      element.setAttribute('href', link.href.value);
      for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
      }

      return element;
    };

    return { ...app, link, click, anchor };
  }

  test('navigate() opens the route with the params and query of the link', async () => {
    const { scope, history, link } = await setup();

    link.navigate();
    await allSettled(scope);

    expect(history.location.pathname).toBe('/users/1');
    expect(history.location.search).toBe('?tab=posts');
  });

  test('navigate(event) opens the route and prevents the default action', async () => {
    const { history, click, anchor } = await setup();
    const event = await click(anchor());

    expect(event.defaultPrevented).toBe(true);
    expect(history.location.pathname).toBe('/users/1');
  });

  test('navigate(event) leaves a modified or prevented click to the browser', async () => {
    const { history, click, anchor } = await setup();
    const prevented = anchor();

    prevented.addEventListener('click', (event) => event.preventDefault());

    for (const event of [
      await click(anchor(), { metaKey: true }),
      await click(anchor(), { ctrlKey: true }),
      await click(anchor(), { shiftKey: true }),
      await click(anchor(), { altKey: true }),
      await click(anchor(), { button: 1 }),
    ]) {
      expect(event.defaultPrevented).toBe(false);
    }
    await click(prevented);

    expect(history.location.pathname).toBe('/home');
  });

  test('navigate(event) leaves a cross-origin or download anchor to the browser', async () => {
    const { history, click, anchor } = await setup();

    for (const event of [
      await click(anchor({ href: 'https://example.com/users/1' })),
      await click(anchor({ download: '' })),
      await click(anchor({ target: '_blank' })),
    ]) {
      expect(event.defaultPrevented).toBe(false);
    }

    expect(history.location.pathname).toBe('/home');
  });

  test('navigate(event) on an element that is not an anchor opens the route', async () => {
    const { history, click } = await setup();
    const event = await click(document.createElement('button'));

    expect(event.defaultPrevented).toBe(true);
    expect(history.location.pathname).toBe('/users/1');
  });
});
