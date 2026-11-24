// The Vue port of packages/react/tests/outlet.test.tsx. The names and the
// steps of the cases are the same, so the two suites can be compared.
import { allSettled, fork } from 'effector';
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { flushPromises } from '@vue/test-utils';
import { createBrowserHistory, createMemoryHistory } from 'history';
import { describe, expect, test } from 'vitest';
import { defineComponent, h, onMounted, onUnmounted } from 'vue';
import { createRoutesView, createRouteView, Outlet } from '../lib';
import { mountRoutes, testIdQueries } from './helpers';

describe('Outlet Component', () => {
  test('renders child route in outlet', async () => {
    const profileRoute = createRoute({ path: '/profile' });
    const settingsRoute = createRoute({
      path: '/settings',
      parent: profileRoute,
    });

    const scope = fork();
    const router = createRouter({ routes: [profileRoute, settingsRoute] });

    const history = createMemoryHistory();
    history.push('/profile');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const ProfileView = () =>
      h('div', [h('h1', { 'data-testid': 'profile' }, 'Profile'), h(Outlet)]);

    const SettingsView = () =>
      h('p', { 'data-testid': 'settings' }, 'Settings');

    const RoutesView = createRoutesView({
      routes: [
        {
          route: profileRoute,
          view: ProfileView,
          children: [
            {
              route: settingsRoute,
              view: SettingsView,
            },
          ],
        },
      ],
    });

    const { getByTestId, queryByTestId } = testIdQueries(
      mountRoutes(router, scope, RoutesView),
    );

    expect(getByTestId('profile').textContent).toBe('Profile');
    expect(queryByTestId('settings')).toBeFalsy();

    await allSettled(settingsRoute.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('settings')).toBeTruthy();

    expect(getByTestId('profile').textContent).toBe('Profile');
    expect(getByTestId('settings').textContent).toBe('Settings');
  });

  test('outlet renders nothing when no child route is active', async () => {
    const profileRoute = createRoute({ path: '/profile' });
    const settingsRoute = createRoute({
      path: '/settings',
      parent: profileRoute,
    });

    const scope = fork();
    const router = createRouter({ routes: [profileRoute, settingsRoute] });

    const history = createMemoryHistory();
    history.push('/profile');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const ProfileView = () =>
      h('div', [
        h('h1', { 'data-testid': 'profile' }, 'Profile'),
        h('div', { 'data-testid': 'outlet-container' }, [h(Outlet)]),
      ]);

    const SettingsView = () =>
      h('p', { 'data-testid': 'settings' }, 'Settings');

    const RoutesView = createRoutesView({
      routes: [
        {
          route: profileRoute,
          view: ProfileView,
          children: [
            {
              route: settingsRoute,
              view: SettingsView,
            },
          ],
        },
      ],
    });

    const { getByTestId, queryByTestId } = testIdQueries(
      mountRoutes(router, scope, RoutesView),
    );

    expect(getByTestId('profile').textContent).toBe('Profile');
    // Vue leaves a comment node for an empty render, and no element.
    expect(getByTestId('outlet-container').children.length).toBe(0);
    expect(queryByTestId('settings')).toBeFalsy();
  });

  test('outlet switches between sibling routes', async () => {
    const profileRoute = createRoute({ path: '/profile' });
    const settingsRoute = createRoute({
      path: '/settings',
      parent: profileRoute,
    });
    const notificationsRoute = createRoute({
      path: '/notifications',
      parent: profileRoute,
    });

    const scope = fork();
    const router = createRouter({
      routes: [profileRoute, settingsRoute, notificationsRoute],
    });

    const history = createMemoryHistory();
    history.push('/profile');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const ProfileView = () =>
      h('div', [h('h1', { 'data-testid': 'profile' }, 'Profile'), h(Outlet)]);

    const SettingsView = () =>
      h('p', { 'data-testid': 'settings' }, 'Settings');
    const NotificationsView = () =>
      h('p', { 'data-testid': 'notifications' }, 'Notifications');

    const RoutesView = createRoutesView({
      routes: [
        {
          route: profileRoute,
          view: ProfileView,
          children: [
            {
              route: settingsRoute,
              view: SettingsView,
            },
            {
              route: notificationsRoute,
              view: NotificationsView,
            },
          ],
        },
      ],
    });

    const { getByTestId, queryByTestId } = testIdQueries(
      mountRoutes(router, scope, RoutesView),
    );

    await allSettled(settingsRoute.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('settings')).toBeTruthy();
    expect(getByTestId('settings').textContent).toBe('Settings');
    expect(queryByTestId('notifications')).toBeFalsy();

    await allSettled(notificationsRoute.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('notifications')).toBeTruthy();
    expect(getByTestId('notifications').textContent).toBe('Notifications');
    expect(queryByTestId('settings')).toBeFalsy();

    await allSettled(profileRoute.open, { scope, params: undefined });
    await flushPromises();

    expect(queryByTestId('notifications')).toBeFalsy();
    expect(getByTestId('profile').textContent).toBe('Profile');
    expect(queryByTestId('settings')).toBeFalsy();
    expect(queryByTestId('notifications')).toBeFalsy();
  });

  test('outlet with simple nested routes', async () => {
    const dashboardRoute = createRoute({ path: '/dashboard' });
    const settingsRoute = createRoute({
      path: '/settings',
      parent: dashboardRoute,
    });

    const scope = fork();
    const router = createRouter({ routes: [dashboardRoute, settingsRoute] });

    const history = createMemoryHistory();
    history.push('/dashboard');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const DashboardView = () =>
      h('div', [
        h('h1', { 'data-testid': 'dashboard' }, 'Dashboard'),
        h(Outlet),
      ]);

    const SettingsView = () =>
      h('p', { 'data-testid': 'settings' }, 'Settings Content');

    const RoutesView = createRoutesView({
      routes: [
        {
          route: dashboardRoute,
          view: DashboardView,
          children: [
            {
              route: settingsRoute,
              view: SettingsView,
            },
          ],
        },
      ],
    });

    const { getByTestId, queryByTestId } = testIdQueries(
      mountRoutes(router, scope, RoutesView),
    );

    expect(getByTestId('dashboard').textContent).toBe('Dashboard');
    expect(queryByTestId('settings')).toBeFalsy();

    await allSettled(settingsRoute.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('settings')).toBeTruthy();

    expect(getByTestId('dashboard').textContent).toBe('Dashboard');
    expect(getByTestId('settings').textContent).toBe('Settings Content');
  });

  test('outlet with nested router', async () => {
    const scope = fork();

    const rootRoutes = {
      profile: createRoute({ path: '/profile' }),
    };

    const profileRoutes = {
      friends: createRoute({ path: '/friends', parent: rootRoutes.profile }),
      settings: createRoute({ path: '/settings', parent: rootRoutes.profile }),
    };

    const profileRouter = createRouter({
      routes: [profileRoutes.friends, profileRoutes.settings],
    });

    const router = createRouter({
      routes: [rootRoutes.profile, profileRouter],
    });

    const history = createMemoryHistory();
    history.push('/profile');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const ProfileView = () =>
      h('div', [h('h1', { 'data-testid': 'profile' }, 'Profile'), h(Outlet)]);

    const FriendsView = () => h('p', { 'data-testid': 'friends' }, 'Friends');
    const SettingsView = () =>
      h('p', { 'data-testid': 'settings' }, 'Settings');

    const ProfileRoutesView = createRoutesView({
      routes: [
        {
          route: profileRoutes.friends,
          view: FriendsView,
        },
        {
          route: profileRoutes.settings,
          view: SettingsView,
        },
      ],
    });

    const RoutesView = createRoutesView({
      routes: [
        {
          route: rootRoutes.profile,
          view: ProfileView,
          children: [
            {
              route: profileRouter,
              view: ProfileRoutesView,
            },
          ],
        },
      ],
    });

    const { getByTestId, queryByTestId } = testIdQueries(
      mountRoutes(router, scope, RoutesView),
    );

    expect(getByTestId('profile').textContent).toBe('Profile');
    expect(queryByTestId('friends')).toBeFalsy();
    expect(queryByTestId('settings')).toBeFalsy();

    await allSettled(profileRoutes.friends.open, { scope, params: undefined });
    await flushPromises();

    expect(getByTestId('friends')).toBeTruthy();

    expect(getByTestId('profile').textContent).toBe('Profile');
    expect(getByTestId('friends').textContent).toBe('Friends');
    expect(queryByTestId('settings')).toBeFalsy();

    await allSettled(profileRoutes.settings.open, {
      scope,
      params: undefined,
    });
    await flushPromises();

    expect(getByTestId('settings')).toBeTruthy();

    expect(getByTestId('profile').textContent).toBe('Profile');
    expect(getByTestId('settings').textContent).toBe('Settings');
    expect(queryByTestId('friends')).toBeFalsy();

    await allSettled(rootRoutes.profile.open, { scope, params: undefined });
    await flushPromises();

    expect(queryByTestId('friends')).toBeFalsy();
    expect(getByTestId('profile').textContent).toBe('Profile');
    expect(queryByTestId('friends')).toBeFalsy();
    expect(queryByTestId('settings')).toBeFalsy();
  });

  test('outled with nested routes created via createRouteView', async () => {
    const profileRoute = createRoute({ path: '/profile' });
    const settingsRoute = createRoute({
      path: '/settings',
      parent: profileRoute,
    });

    const scope = fork();
    const router = createRouter({ routes: [profileRoute, settingsRoute] });

    const history = createBrowserHistory();
    history.push('/profile/settings');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const RoutesView = createRoutesView({
      routes: [
        createRouteView({
          route: profileRoute,
          view: () =>
            h('div', [
              h('h1', { 'data-testid': 'profile' }, 'Profile'),
              h(Outlet),
            ]),
          children: [
            createRouteView({
              route: settingsRoute,
              view: () => h('p', { 'data-testid': 'settings' }, 'Settings'),
            }),
          ],
        }),
      ],
    });

    const wrapper = mountRoutes(router, scope, RoutesView);

    expect(wrapper.html()).toMatchInlineSnapshot(`
      "<div>
        <h1 data-testid="profile">Profile</h1>
        <p data-testid="settings">Settings</p>
      </div>"
    `);
  });

  test('keeps parent view mounted when switching child routes', async () => {
    const profileRoute = createRoute({ path: '/profile' });
    const settingsRoute = createRoute({
      path: '/settings',
      parent: profileRoute,
    });
    const friendsRoute = createRoute({
      path: '/friends',
      parent: profileRoute,
    });
    const scope = fork();
    const router = createRouter({
      routes: [profileRoute, settingsRoute, friendsRoute],
    });
    const history = createMemoryHistory({
      initialEntries: ['/profile/settings'],
    });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    let parentMounts = 0;
    let parentUnmounts = 0;

    const ProfileView = defineComponent({
      setup() {
        onMounted(() => {
          parentMounts += 1;
        });
        onUnmounted(() => {
          parentUnmounts += 1;
        });

        return () => h('main', [h('h1', 'Profile'), h(Outlet)]);
      },
    });

    const RoutesView = createRoutesView({
      routes: [
        createRouteView({
          route: profileRoute,
          view: ProfileView,
          children: [
            createRouteView({
              route: settingsRoute,
              view: () => h('p', { 'data-testid': 'settings' }, 'Settings'),
            }),
            createRouteView({
              route: friendsRoute,
              view: () => h('p', { 'data-testid': 'friends' }, 'Friends'),
            }),
          ],
        }),
      ],
    });

    const { getByTestId, queryByTestId } = testIdQueries(
      mountRoutes(router, scope, RoutesView),
    );

    expect(getByTestId('settings')).toBeTruthy();
    expect(parentMounts).toBe(1);
    expect(parentUnmounts).toBe(0);

    await allSettled(friendsRoute.open, { scope, params: undefined });
    await flushPromises();

    expect(queryByTestId('settings')).toBeFalsy();
    expect(getByTestId('friends')).toBeTruthy();
    expect(parentMounts).toBe(1);
    expect(parentUnmounts).toBe(0);
  });

  test('provides recursive outlet context through three levels', async () => {
    const rootRoute = createRoute({ path: '/root' });
    const childRoute = createRoute({ path: '/child', parent: rootRoute });
    const leafRoute = createRoute({ path: '/leaf', parent: childRoute });
    const scope = fork();
    const router = createRouter({
      routes: [rootRoute, childRoute, leafRoute],
    });
    const history = createMemoryHistory({
      initialEntries: ['/root/child/leaf'],
    });

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const RoutesView = createRoutesView({
      routes: [
        createRouteView({
          route: rootRoute,
          view: () => h('div', { 'data-testid': 'root' }, ['root', h(Outlet)]),
          children: [
            createRouteView({
              route: childRoute,
              view: () =>
                h('div', { 'data-testid': 'child' }, ['child', h(Outlet)]),
              children: [
                createRouteView({
                  route: leafRoute,
                  view: () => h('span', { 'data-testid': 'leaf' }, 'leaf'),
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const { getByTestId } = testIdQueries(
      mountRoutes(router, scope, RoutesView),
    );

    expect(getByTestId('root')).toBeTruthy();
    expect(getByTestId('child')).toBeTruthy();
    expect(getByTestId('leaf')).toBeTruthy();
  });
});
