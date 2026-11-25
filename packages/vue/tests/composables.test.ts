import { allSettled, fork } from 'effector';
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { flushPromises } from '@vue/test-utils';
import { createMemoryHistory } from 'history';
import { describe, expect, test } from 'vitest';
import { defineComponent, h } from 'vue';
import {
  useLink,
  useRouter,
  type UseLinkReturn,
  type UseRouterReturn,
} from '../lib';
import { mountRoutes } from './helpers';

async function setup() {
  const home = createRoute({ path: '/home' });
  const user = createRoute({ path: '/users/:id' });
  const scope = fork();
  const router = createRouter({ routes: [home, user] });

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(createMemoryHistory({ initialEntries: ['/home'] })),
  });

  return { home, user, scope, router };
}

describe('composables', () => {
  test('useRouter returns refs and bound events', async () => {
    const { home, user, scope, router } = await setup();
    let result!: UseRouterReturn;
    const wrapper = mountRoutes(
      router,
      scope,
      defineComponent({
        setup() {
          result = useRouter();

          return () => h('p', `path: ${result.path.value}`);
        },
      }),
    );

    expect(result.path.value).toBe('/home');
    expect(result.query.value).toEqual({});
    expect(result.activeRoutes.value).toEqual([home]);

    const payload = { path: '/users/7', query: { tab: 'a' } };

    // An Effector event returns its payload, and so does the bound function.
    expect(result.onNavigate(payload)).toBe(payload);
    await allSettled(scope);
    await flushPromises();

    expect(result.path.value).toBe('/users/7');
    expect(result.query.value).toEqual({ tab: 'a' });
    expect(result.activeRoutes.value).toEqual([user]);
    expect(wrapper.text()).toBe('path: /users/7');

    result.onBack();
    await allSettled(scope);
    expect(result.path.value).toBe('/home');

    result.onForward();
    await allSettled(scope);
    expect(result.path.value).toBe('/users/7');
  });

  test('useLink onOpen opens the route and returns its payload', async () => {
    const { user, scope, router } = await setup();
    let link!: UseLinkReturn<{ id: string }>;

    mountRoutes(
      router,
      scope,
      defineComponent({
        setup() {
          link = useLink(user);

          return () => null;
        },
      }),
    );

    expect(link.build({ id: '7' }, { tab: 'a' })).toBe('/users/7?tab=a');

    const payload = { params: { id: '7' } };

    expect(link.onOpen(payload)).toBe(payload);
    await allSettled(scope);

    expect(scope.getState(user.$isOpened)).toBe(true);
    expect(scope.getState(user.$params)).toEqual({ id: '7' });
  });
});
