// @vitest-environment happy-dom
import React from 'react';
import { allSettled, fork } from 'effector';
import { Provider } from 'effector-react';
import { createMemoryHistory } from 'history';
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const stackScreens: Array<Record<string, unknown>> = [];
const tabScreens: Array<Record<string, unknown>> = [];

vi.mock('@react-navigation/native', () => ({
  StackActions: {
    replace: (name: string, params?: object) => ({
      type: 'REPLACE',
      payload: { name, params },
    }),
  },
}));

vi.mock('react-native', () => ({
  Text: ({ children }: { children?: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

vi.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="stack-navigator">{children}</div>
    ),
    Screen: (props: Record<string, unknown>) => {
      stackScreens.push(props);
      return <div data-testid={`stack-screen-${String(props.name)}`} />;
    },
  }),
}));

vi.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="tabs-navigator">{children}</div>
    ),
    Screen: (props: Record<string, unknown>) => {
      tabScreens.push(props);
      return <div data-testid={`tab-screen-${String(props.name)}`} />;
    },
  }),
}));

const { createBottomTabsNavigator, createStackNavigator } =
  await import('../lib');

type NativeEvent = 'ready' | 'state';

function createNavigationRef(ready = false) {
  let currentReady = ready;
  let currentRoute: { name: string; params?: object } = { name: '/outside' };
  const listeners = new Map<NativeEvent, Set<() => void>>();
  const ref = {
    navigate: vi.fn(),
    dispatch: vi.fn(),
    isReady: () => currentReady,
    getRootState: () => ({ key: 'root', index: 0, routes: [currentRoute] }),
    getCurrentRoute: () => currentRoute,
    addListener: (event: NativeEvent, listener: () => void) => {
      const set = listeners.get(event) ?? new Set();
      set.add(listener);
      listeners.set(event, set);
      return () => set.delete(listener);
    },
  };

  return {
    ref,
    ready() {
      currentReady = true;
    },
    setRoute(route: { name: string; params?: object }) {
      currentRoute = route;
    },
    emit(event: NativeEvent) {
      listeners.get(event)?.forEach((listener) => listener());
    },
    listenerCount(event: NativeEvent) {
      return listeners.get(event)?.size ?? 0;
    },
  };
}

describe('React Native navigator integration shape', () => {
  beforeEach(() => {
    stackScreens.length = 0;
    tabScreens.length = 0;
  });

  test('renders direct navigator, complete names/options, and synchronizes latest target', async () => {
    const home = createRoute({ path: '/home' });
    const profile = createRoute({ path: '/profile/:id' });
    const router = createRouter({ routes: [home, profile] });
    const scope = fork();
    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(
        createMemoryHistory({ initialEntries: ['/home'] }),
      ),
    });
    const native = createNavigationRef(false);
    const Profile = () => <span>profile</span>;
    const Stack = createStackNavigator({
      router,
      routes: [
        { route: home, view: () => <span>home</span> },
        {
          route: profile,
          view: Profile,
          options: ({ route }) => ({ title: route.name }),
        },
      ],
    });

    expect(typeof Stack).toBe('function');
    const rendered = render(
      <Provider value={scope}>
        <Stack navigationRef={native.ref as never} />
      </Provider>,
    );

    expect(rendered.getByTestId('stack-screen-/home')).toBeTruthy();
    expect(rendered.getByTestId('stack-screen-/profile/:id')).toBeTruthy();
    expect(stackScreens[1].options).toBeTypeOf('function');

    await allSettled(profile.open, {
      scope,
      params: { params: { id: '42' } },
    });
    expect(native.ref.navigate).not.toHaveBeenCalled();

    native.ready();
    native.emit('ready');
    expect(native.ref.navigate).toHaveBeenCalledWith('/profile/:id', {
      id: '42',
    });

    native.setRoute({ name: '/profile/:id', params: { id: '42' } });
    native.emit('state');
    const calls = native.ref.navigate.mock.calls.length;
    native.emit('state');
    expect(native.ref.navigate).toHaveBeenCalledTimes(calls);

    await allSettled(home.open, {
      scope,
      params: { replace: true },
    });
    expect(native.ref.navigate).toHaveBeenLastCalledWith('/home');

    rendered.unmount();
    expect(native.listenerCount('ready')).toBe(0);
    expect(native.listenerCount('state')).toBe(0);
  });

  test('renders bottom tabs and translates tab press through Router', async () => {
    const home = createRoute({ path: '/home' });
    const settings = createRoute({ path: '/settings' });
    const router = createRouter({ routes: [home, settings] });
    const scope = fork();
    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(
        createMemoryHistory({ initialEntries: ['/home'] }),
      ),
    });
    const native = createNavigationRef(true);
    const Tabs = createBottomTabsNavigator({
      router,
      routes: [
        { route: home, view: () => <span>home</span> },
        { route: settings, view: () => <span>settings</span> },
      ],
    });

    const rendered = render(
      <Provider value={scope}>
        <Tabs navigationRef={native.ref as never} />
      </Provider>,
    );

    expect(rendered.getByTestId('tab-screen-/home')).toBeTruthy();
    expect(rendered.getByTestId('tab-screen-/settings')).toBeTruthy();
    const preventDefault = vi.fn();
    const tabPress = (
      tabScreens[1].listeners as {
        tabPress: (event: { preventDefault: () => void }) => void;
      }
    ).tabPress;
    tabPress({ preventDefault });
    await allSettled(scope);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(scope.getState(settings.$isOpened)).toBe(true);

    rendered.unmount();
    expect(native.listenerCount('ready')).toBe(0);
    expect(native.listenerCount('state')).toBe(0);
  });

  test('runs the published React Native quick start through the same harness', async () => {
    const { createReactNativeQuickStart } =
      await import('../../../docs/quick-starts/react-native');
    const quickStart = createReactNativeQuickStart();
    const scope = fork();
    await allSettled(quickStart.router.setHistory, {
      scope,
      params: historyAdapter(
        createMemoryHistory({ initialEntries: ['/home'] }),
      ),
    });
    const native = createNavigationRef(false);
    const rendered = render(
      <Provider value={scope}>
        <quickStart.Stack navigationRef={native.ref as never} />
      </Provider>,
    );

    expect(rendered.getByTestId('stack-screen-/home')).toBeTruthy();
    expect(rendered.getByTestId('stack-screen-/profile/:id')).toBeTruthy();

    await allSettled(quickStart.profile.open, {
      scope,
      params: { params: { id: '42' } },
    });
    native.ready();
    native.emit('ready');
    expect(native.ref.navigate).toHaveBeenCalledWith('/profile/:id', {
      id: '42',
    });

    rendered.unmount();
  });
});
