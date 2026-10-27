import { flushPromises, mount } from '@vue/test-utils';
import { allSettled, fork } from 'effector';
import { EffectorScopePlugin } from 'effector-vue/composition';
import { expect, test } from 'vitest';
import { createVueQuickStart } from '../../../docs/quick-starts/vue';

test('Vue quick start renders initial route and one navigation', async () => {
  const quickStart = createVueQuickStart();
  const scope = fork();
  const view = mount(quickStart.RoutesView, {
    global: {
      plugins: [EffectorScopePlugin({ scope })],
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
