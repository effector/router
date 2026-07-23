import { flushPromises, mount } from '@vue/test-utils';
import { nextTick, type Plugin } from 'vue';
import { allSettled, fork } from 'effector';
import { createRequire } from 'node:module';
import { expect, test } from 'vitest';
import { createVueQuickStart } from '../../../docs/quick-starts/vue';

test('Vue quick start renders initial route and one navigation', async () => {
  const quickStart = createVueQuickStart();
  const scope = fork();
  const { EffectorScopePlugin } = createRequire(import.meta.url)(
    'effector-vue',
  ) as { EffectorScopePlugin: (config: { scope: typeof scope }) => object };
  const view = mount(quickStart.RoutesView, {
    global: {
      plugins: [EffectorScopePlugin({ scope }) as unknown as Plugin],
    },
  });

  await allSettled(quickStart.home.open, {
    scope,
    params: {},
  });
  await flushPromises();
  expect(view.find('[data-testid="home"]').exists()).toBe(true);

  await allSettled(quickStart.profile.open, {
    scope,
    params: { params: { id: '42' } },
  });
  await flushPromises();
  expect(view.find('[data-testid="profile"]').exists()).toBe(true);
});
