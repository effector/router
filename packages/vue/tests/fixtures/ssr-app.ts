import { allSettled, fork, type Scope } from 'effector';
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { EffectorScopePlugin } from 'effector-vue/composition';
import { createMemoryHistory } from 'history';
import { createSSRApp, defineComponent, h, onMounted, onUnmounted } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  createLazyRouteView,
  createRouteView,
  createRoutesView,
  Link,
  Outlet,
  RouterProvider,
  withLayout,
} from '../../lib';

export const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface SsrAppOptions {
  /** Milliseconds the lazy loaders wait before they load the page. */
  lazyDelay?: number;
  otherwise?: boolean;
}

/**
 * The application of the server render and hydration tests. Every call makes
 * new routes, a new router and new views: the server and the client are two
 * processes, and a lazy view keeps its loaded page.
 */
export function createSsrApp(options: SsrAppOptions = {}) {
  const { lazyDelay = 0, otherwise = false } = options;
  const counters = { profileMounts: 0, profileUnmounts: 0, loaderCalls: 0 };

  const home = createRoute({ path: '/' });
  const profile = createRoute({ path: '/profile/:id' });
  const settings = createRoute({ path: '/settings', parent: profile });
  const lazy = createRoute({ path: '/lazy/:id' });
  const about = createRoute({ path: '/about' });
  const contacts = createRoute({ path: '/contacts' });
  const router = createRouter({
    routes: [home, profile, settings, lazy, about, contacts],
  });

  // A real dynamic import: Vue takes `default` of a module namespace.
  const loadLazyPage = async () => {
    counters.loaderCalls += 1;
    if (lazyDelay > 0) await delay(lazyDelay);

    return import('./ssr-lazy-page');
  };

  const Home = defineComponent({
    render: () => h('main', { 'data-page': 'home' }, 'home'),
  });
  const Profile = defineComponent({
    setup() {
      onMounted(() => {
        counters.profileMounts += 1;
      });
      onUnmounted(() => {
        counters.profileUnmounts += 1;
      });

      return () =>
        h('section', { 'data-page': 'profile' }, [
          h(Link, { to: home, 'data-link': 'home' }, () => 'to home'),
          h(
            Link,
            { to: profile, params: { id: '1' }, 'data-link': 'profile' },
            () => 'to profile',
          ),
          h(
            Link,
            { to: lazy, params: { id: '7' }, 'data-link': 'lazy' },
            () => 'to lazy',
          ),
          h(Outlet),
        ]);
    },
  });
  const Settings = defineComponent({
    render: () => h('div', { 'data-page': 'settings' }, 'settings'),
  });
  const About = defineComponent({
    render: () => h('div', { 'data-page': 'about' }, 'about'),
  });
  const Layout = defineComponent({
    setup: (_, { slots }) => {
      return () => h('div', { 'data-layout': 'group' }, slots.default?.());
    },
  });
  const Fallback = defineComponent({
    render: () => h('p', { 'data-fallback': '' }, 'loading'),
  });
  const Otherwise = defineComponent({
    render: () => h('p', { 'data-otherwise': '' }, 'not found'),
  });

  const RoutesView = createRoutesView({
    routes: [
      createRouteView({ route: home, view: Home }),
      createRouteView({
        route: profile,
        view: Profile,
        children: [createRouteView({ route: settings, view: Settings })],
      }),
      createLazyRouteView({
        route: lazy,
        view: loadLazyPage,
        fallback: Fallback,
      }),
      ...withLayout(Layout, [
        createRouteView({ route: about, view: About }),
        createLazyRouteView({
          route: contacts,
          view: loadLazyPage,
          fallback: Fallback,
        }),
      ]),
    ],
    otherwise: otherwise ? Otherwise : undefined,
  });

  const Root = defineComponent({
    render: () =>
      h(RouterProvider, { router }, { default: () => h(RoutesView) }),
  });

  return {
    routes: { home, profile, settings, lazy, about, contacts },
    router,
    Root,
    counters,
  };
}

export type SsrApp = ReturnType<typeof createSsrApp>;

export function attachHistory(app: SsrApp, scope: Scope, url: string) {
  return allSettled(app.router.setHistory, {
    scope,
    params: historyAdapter(createMemoryHistory({ initialEntries: [url] })),
  });
}

/** Sum of the subscriptions `useUnit` keeps in the scope. */
export function countScopeLinks(scope: Scope): number {
  const { additionalLinks } = scope as unknown as {
    additionalLinks: Record<string, unknown[]>;
  };

  return Object.values(additionalLinks).reduce(
    (sum, list) => sum + list.length,
    0,
  );
}

/** Renders `url` on a new application, with history attached before it. */
export async function renderOnServer(url: string, options?: SsrAppOptions) {
  const app = createSsrApp(options);
  const scope = fork();

  await attachHistory(app, scope, url);

  const linksBefore = countScopeLinks(scope);
  const html = await renderToString(
    createSSRApp(app.Root).use(EffectorScopePlugin({ scope })),
  );

  return { html, scope, app, linksBefore, linksAfter: countScopeLinks(scope) };
}
