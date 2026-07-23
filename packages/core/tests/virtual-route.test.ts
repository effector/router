import { allSettled, createStore, fork } from 'effector';
import { describe, expect, test, vi } from 'vitest';
import { createVirtualRoute } from '../lib';

describe('deprecated createVirtualRoute compatibility', () => {
  test('delegates activation while preserving transformer and pending store', async () => {
    const scope = fork();
    const $isPending = createStore(false);
    const route = createVirtualRoute<{ userId: string }, { id: string }>({
      $isPending,
      transformer: ({ userId }) => ({ id: userId }),
    });
    const opened = vi.fn();

    route.opened.watch(opened);

    await allSettled(route.open, {
      scope,
      params: { userId: 'user-1' },
    });

    expect(scope.getState(route.$params)).toStrictEqual({ id: 'user-1' });
    expect(scope.getState(route.$isOpened)).toBe(true);
    expect(opened).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(route.$isPending).toBe($isPending);

    await allSettled(route.close, { scope });
    expect(scope.getState(route.$isOpened)).toBe(false);
  });
});
