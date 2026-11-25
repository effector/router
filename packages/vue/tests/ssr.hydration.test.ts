import {
  allSettled,
  createWatch,
  fork,
  type Scope,
  type StoreWritable,
  type Unit,
} from 'effector';
import { flushPromises } from '@vue/test-utils';
import { EffectorScopePlugin } from 'effector-vue/composition';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp, createSSRApp, nextTick, type App } from 'vue';
import {
  attachHistory,
  countScopeLinks,
  createSsrApp,
  delay,
  renderOnServer,
  type SsrApp,
} from './fixtures/ssr-app';
import { lazyPage } from './fixtures/ssr-lazy-page';

const mounted: App[] = [];

// Vue reports a hydration mismatch through console.
function spyConsole() {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});

  return () =>
    [...warn.mock.calls, ...error.mock.calls].map(
      (call) => String(call[0]).split('\n')[0],
    );
}

function containerWith(html: string) {
  const container = document.createElement('div');

  document.body.appendChild(container);
  container.innerHTML = html;

  return container;
}

function mountApp(
  create: typeof createApp,
  container: HTMLElement,
  app: SsrApp,
  scope: Scope,
) {
  const vueApp = create(app.Root).use(EffectorScopePlugin({ scope }));

  vueApp.mount(container);
  mounted.push(vueApp);
}

const page = (container: HTMLElement) => container.querySelector('[data-page]');

// The client of a server render: a new application and a new scope, with the
// history attached before the mount.
async function hydrate(
  url: string,
  options?: Parameters<typeof createSsrApp>[0],
) {
  const server = await renderOnServer(url);
  const app = createSsrApp(options);
  const scope = fork();

  await attachHistory(app, scope, url);

  const container = containerWith(server.html);
  const before = page(container);
  const messages = spyConsole();

  mountApp(createSSRApp, container, app, scope);

  return { server, app, scope, container, before, messages };
}

// A client scope with the state of the opened profile route, as if it came
// from the server. The stores of a route are typed as read-only, and `fork`
// takes writable ones.
function forkWithProfile(app: SsrApp) {
  const { $isOpened, $params } = app.routes.profile;

  return fork({
    values: [
      [$isOpened as StoreWritable<boolean>, true],
      [$params as StoreWritable<{ id: string }>, { id: '1' }],
    ],
  });
}

afterEach(() => {
  for (const app of mounted.splice(0)) app.unmount();
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('hydration with history attached before the mount', () => {
  test('control: this environment reports a mismatch', async () => {
    const app = createSsrApp();
    const scope = fork();

    await attachHistory(app, scope, '/profile/1');

    const container = containerWith('<!--[--><main>other</main><!--]-->');
    const messages = spyConsole();

    mountApp(createSSRApp, container, app, scope);

    expect(messages()).toContain('[Vue warn]: Hydration node mismatch:');
  });

  test('plain view: no warnings, the page node is kept, Link works', async () => {
    const { server, app, scope, container, before, messages } =
      await hydrate('/profile/1');

    await flushPromises();

    expect(messages()).toEqual([]);
    expect(before).not.toBeNull();
    expect(page(container)).toBe(before);
    expect(container.innerHTML).toBe(server.html);
    expect(app.counters.profileMounts).toBe(1);
    // A client mount subscribes, the server render does not.
    expect(countScopeLinks(scope)).toBeGreaterThan(0);
    expect(server.linksAfter).toBe(server.linksBefore);

    container
      .querySelector('[data-link="home"]')!
      .dispatchEvent(
        new MouseEvent('click', { bubbles: true, cancelable: true }),
      );
    await allSettled(scope);
    await flushPromises();

    expect(page(container)?.getAttribute('data-page')).toBe('home');
  });

  test('nested Outlet: no warnings, the parent and the child nodes are kept', async () => {
    const { server, container, messages } = await hydrate(
      '/profile/1/settings',
    );
    const parent = container.querySelector('[data-page="profile"]');
    const child = container.querySelector('[data-page="settings"]');

    await flushPromises();

    expect(messages()).toEqual([]);
    expect(child).not.toBeNull();
    expect(container.querySelector('[data-page="profile"]')).toBe(parent);
    expect(container.querySelector('[data-page="settings"]')).toBe(child);
    expect(container.innerHTML).toBe(server.html);
  });

  test('lazy view: no warnings and no fallback while the chunk loads', async () => {
    const mountsBefore = lazyPage.mounts;
    const { server, app, container, before, messages } = await hydrate(
      '/lazy/7',
      { lazyDelay: 60 },
    );

    await nextTick();

    // The chunk is still loading: the server markup stays as it is.
    expect(container.innerHTML).toBe(server.html);
    expect(container.querySelector('[data-fallback]')).toBeNull();
    expect(lazyPage.mounts).toBe(mountsBefore);

    await delay(150);
    await flushPromises();

    expect(messages()).toEqual([]);
    expect(app.counters.loaderCalls).toBe(1);
    expect(page(container)).toBe(before);
    expect(container.innerHTML).toBe(server.html);
    expect(lazyPage.mounts).toBe(mountsBefore + 1);
  });

  test('layout group: no warnings, the layout and the page nodes are kept', async () => {
    const { server, container, before, messages } = await hydrate('/about');
    const layout = container.querySelector('[data-layout]');

    await flushPromises();

    expect(messages()).toEqual([]);
    expect(layout).not.toBeNull();
    expect(container.querySelector('[data-layout]')).toBe(layout);
    expect(page(container)).toBe(before);
    expect(container.innerHTML).toBe(server.html);
  });

  test('layout group with a lazy view: no warnings and no fallback', async () => {
    const { server, container, before, messages } = await hydrate('/contacts', {
      lazyDelay: 60,
    });

    await nextTick();
    expect(container.querySelector('[data-fallback]')).toBeNull();

    await delay(150);
    await flushPromises();

    expect(messages()).toEqual([]);
    expect(page(container)).toBe(before);
    expect(container.innerHTML).toBe(server.html);
  });
});

describe('route events on the client', () => {
  function logRoute(app: SsrApp, scope: Scope) {
    const route = app.routes.profile;
    const log: string[] = [];
    const events: Record<string, Unit<any>> = {
      opened: route.opened,
      openedOnClient: route.openedOnClient,
      closed: route.closed,
    };

    for (const [name, unit] of Object.entries(events)) {
      createWatch({ unit, scope, fn: () => log.push(name) });
    }
    createWatch({
      unit: route.$isOpened,
      scope,
      fn: (value) => log.push(`$isOpened=${value}`),
    });

    return log;
  }

  // The client scope already holds the state the server sent. `setHistory`
  // opens the matched route again.
  test('opened fires once more on a client with the route state and $isOpened does not flip (current behavior)', async () => {
    const app = createSsrApp();
    const route = app.routes.profile;
    const scope = forkWithProfile(app);

    // Read first, as a mounted page reads it. A store of a scope that nothing
    // has read yet reports its seeded value as an update.
    expect(scope.getState(route.$isOpened)).toBe(true);

    const log = logRoute(app, scope);

    await attachHistory(app, scope, '/profile/1');

    expect(log).toEqual(['openedOnClient', 'opened']);
    expect(scope.getState(route.$isOpened)).toBe(true);
  });

  test('baseline: an empty scope opens the route once', async () => {
    const app = createSsrApp();
    const scope = fork();
    const log = logRoute(app, scope);

    await attachHistory(app, scope, '/profile/1');

    expect(log).toEqual(['openedOnClient', 'opened', '$isOpened=true']);
  });
});

describe('mounting before the history is attached', () => {
  // `$path` is `null` until `setHistory`, and no route is opened. The routes
  // view cannot tell that from an unknown URL.
  test.each([
    { otherwise: true, first: '<p data-otherwise="">not found</p>' },
    { otherwise: false, first: '<!---->' },
  ])(
    'the first render is otherwise, otherwise: $otherwise (current behavior)',
    async ({ otherwise, first }) => {
      const app = createSsrApp({ otherwise });
      const scope = fork();
      const container = containerWith('');

      expect(scope.getState(app.router.$path)).toBeNull();

      mountApp(createApp, container, app, scope);
      expect(container.innerHTML).toBe(first);

      await attachHistory(app, scope, '/profile/1');
      await flushPromises();

      expect(page(container)?.getAttribute('data-page')).toBe('profile');
    },
  );

  test('hydration replaces the server page by otherwise and reports a mismatch (current behavior)', async () => {
    const server = await renderOnServer('/profile/1', { otherwise: true });
    const app = createSsrApp({ otherwise: true });
    const scope = fork();
    const container = containerWith(server.html);
    const before = page(container);
    const messages = spyConsole();

    mountApp(createSSRApp, container, app, scope);
    await flushPromises();

    expect(container.innerHTML).toBe(
      '<!--[--><p data-otherwise="">not found</p><!--]-->',
    );
    expect(messages()).toContain('[Vue warn]: Hydration node mismatch:');
    expect(before?.isConnected).toBe(false);

    await attachHistory(app, scope, '/profile/1');
    await flushPromises();

    expect(page(container)?.getAttribute('data-page')).toBe('profile');
    expect(page(container)).not.toBe(before);
  });

  test('hydration with a scope that holds the route state keeps the server page', async () => {
    const server = await renderOnServer('/profile/1');
    const app = createSsrApp();
    const scope = forkWithProfile(app);
    const container = containerWith(server.html);
    const before = page(container);
    const messages = spyConsole();

    mountApp(createSSRApp, container, app, scope);
    await flushPromises();

    expect(page(container)).toBe(before);

    await attachHistory(app, scope, '/profile/1');
    await flushPromises();

    expect(page(container)).toBe(before);
    expect(app.counters).toMatchObject({
      profileMounts: 1,
      profileUnmounts: 0,
    });
    expect(messages()).toEqual([]);
  });
});
