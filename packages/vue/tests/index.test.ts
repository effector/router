import { allSettled, fork, type Scope } from 'effector';
import { describe, expect, test } from 'vitest';
import {
  createRoute,
  createRouter,
  historyAdapter,
  type Router,
} from '@effector/router';
import { createMemoryHistory } from 'history';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, type Plugin } from 'vue';
import {
  createRouteView,
  createRoutesView,
  Link,
  RouterProvider,
  withLayout,
} from '../lib';

// effector-vue reads the forked scope from a provide() keyed by the value stored
// in `globalProperties.scopeName`. This tiny plugin wires that up for tests.
function EffectorScopePlugin(scope: Scope): Plugin {
  return {
    install(app) {
      app.config.globalProperties.scopeName = 'root';
      app.provide('root', scope);
    },
  };
}

function mountRoutes(
  router: Router,
  scope: Scope,
  RoutesView: ReturnType<typeof createRoutesView>,
) {
  return mount(RouterProvider, {
    props: { router },
    slots: { default: () => h(RoutesView) },
    global: {
      plugins: [EffectorScopePlugin(scope)],
    },
  });
}

describe('vue bindings', () => {
  test('component changed when path changed', async () => {
    const route1 = createRoute({ path: '/app' });
    const route2 = createRoute({ path: '/faq' });

    const scope = fork();
    const router = createRouter({ routes: [route1, route2] });
    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const RoutesView = createRoutesView({
      routes: [
        { route: route1, view: () => h('p', { id: 'message' }, 'route1') },
        { route: route2, view: () => h('p', { id: 'message' }, 'route2') },
      ],
      otherwise: () => h('p', { id: 'message' }, 'not found'),
    });

    const wrapper = mountRoutes(router, scope, RoutesView);

    await allSettled(route1.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.find('#message').text()).toBe('route1');

    await allSettled(route2.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.find('#message').text()).toBe('route2');

    await allSettled(router.navigate, {
      scope,
      params: { path: '/not-found', query: {} },
    });
    await flushPromises();
    expect(wrapper.find('#message').text()).toBe('not found');
  });

  test('link navigates on click', async () => {
    const route1 = createRoute({ path: '/app' });
    const route2 = createRoute({ path: '/faq/:id' });

    const scope = fork();
    const router = createRouter({ routes: [route1, route2] });
    const history = createMemoryHistory();
    history.push('/app');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const RoutesView = createRoutesView({
      routes: [
        {
          route: route1,
          view: () =>
            h(
              Link,
              { to: route2, params: { id: '123' }, id: 'link' },
              () => 'to route2',
            ),
        },
        {
          route: route2,
          view: () => h(Link, { to: route1, id: 'link' }, () => 'to route1'),
        },
      ],
    });

    const wrapper = mountRoutes(router, scope, RoutesView);

    await allSettled(route1.open, { scope, params: undefined });
    await flushPromises();

    await wrapper.find('#link').trigger('click');
    await allSettled(scope);
    await flushPromises();

    expect(scope.getState(route2.$isOpened)).toBeTruthy();
    expect(scope.getState(route2.$params)).toStrictEqual({ id: '123' });
  });

  test('with layout', async () => {
    const profileRoute = createRoute({ path: '/profile' });
    const authRoute = createRoute({ path: '/auth' });

    const scope = fork();
    const router = createRouter({ routes: [profileRoute, authRoute] });
    const history = createMemoryHistory();

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    const ProfileLayout = defineComponent({
      setup(_, { slots }) {
        return () => [
          h('p', { 'data-testid': 'layout' }, 'layout!'),
          slots.default?.(),
        ];
      },
    });

    const RoutesView = createRoutesView({
      routes: [
        ...withLayout(ProfileLayout, [
          createRouteView({
            route: profileRoute,
            view: () => h('p', { 'data-testid': 'message' }, 'profile'),
          }),
        ]),
        createRouteView({
          route: authRoute,
          view: () => h('p', { 'data-testid': 'message' }, 'auth'),
        }),
      ],
    });

    const wrapper = mountRoutes(router, scope, RoutesView);

    await allSettled(profileRoute.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.find('[data-testid="layout"]').text()).toBe('layout!');
    expect(wrapper.find('[data-testid="message"]').text()).toBe('profile');

    await allSettled(authRoute.open, { scope, params: undefined });
    await flushPromises();
    expect(wrapper.find('[data-testid="layout"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="message"]').text()).toBe('auth');
  });
});
