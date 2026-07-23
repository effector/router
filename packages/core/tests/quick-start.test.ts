import { allSettled, fork } from 'effector';
import { expect, test } from 'vitest';
import { createCoreQuickStart } from '../../../docs/quick-starts/core';

test('core quick start opens its initial route and navigates once', async () => {
  const { home, profile, router } = createCoreQuickStart();
  const scope = fork();
  await allSettled(home.open, { scope, params: {} });
  expect(scope.getState(home.$isOpened)).toBe(true);

  await allSettled(profile.open, {
    scope,
    params: { params: { id: '42' } },
  });
  expect(scope.getState(profile.$isOpened)).toBe(true);
});
