import { createRoute } from '@effector/router';
import { describe, expect, test, vi } from 'vitest';
import { createRouteListeners } from '../lib/navigation-events';

describe('React Navigation events', () => {
  test('opens the route on a native screen focus (#72)', () => {
    const route = createRoute({ path: '/profile' });
    const opened = vi.fn();
    route.open.watch(opened);

    createRouteListeners(route).focus();

    expect(opened).toHaveBeenCalledTimes(1);
  });
});
