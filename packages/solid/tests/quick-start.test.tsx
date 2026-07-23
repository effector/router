import { render } from '@solidjs/testing-library';
import { allSettled, fork } from 'effector';
import { Provider } from 'effector-solid';
import { expect, test } from 'vitest';
import { createSolidQuickStart } from '../../../docs/quick-starts/solid';

test('Solid quick start renders initial route and one navigation', async () => {
  const quickStart = createSolidQuickStart();
  const scope = fork();
  const view = render(() => (
    <Provider value={scope}>
      <quickStart.RoutesView />
    </Provider>
  ));

  await allSettled(quickStart.home.open, {
    scope,
    params: {},
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(view.getByTestId('home')).toBeTruthy();

  await allSettled(quickStart.profile.open, {
    scope,
    params: { params: { id: '42' } },
  });
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(view.getByTestId('profile')).toBeTruthy();
});
