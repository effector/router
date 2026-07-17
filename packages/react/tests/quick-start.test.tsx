import { act, render } from '@testing-library/react';
import { allSettled, fork } from 'effector';
import { Provider } from 'effector-react';
import { expect, test } from 'vitest';
import { createReactQuickStart } from '../../../docs/quick-starts/react';

test('React quick start renders initial route and one navigation', async () => {
  const quickStart = createReactQuickStart();
  const scope = fork();
  const { getByTestId, queryByTestId } = render(
    <Provider value={scope}>
      <quickStart.RoutesView />
    </Provider>,
  );

  await act(() =>
    allSettled(quickStart.home.open, {
      scope,
      params: {},
    }),
  );
  expect(getByTestId('home')).toBeTruthy();

  await act(() =>
    allSettled(quickStart.profile.open, {
      scope,
      params: { params: { id: '42' } },
    }),
  );
  expect(getByTestId('profile')).toBeTruthy();
  expect(queryByTestId('home')).toBeNull();
});
