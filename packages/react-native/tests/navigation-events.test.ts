import { createRoute } from '@effector/router';
import { describe, expect, test, vi } from 'vitest';
import {
  createClosingTransitionListener,
  createRouteListeners,
  createTabPressListener,
} from '../lib/navigation-events';

describe('React Navigation events', () => {
  test('opens the route on a native screen focus (#72)', () => {
    const route = createRoute({ path: '/profile' });
    const opened = vi.fn();
    route.open.watch(opened);

    createRouteListeners(route).focus();

    expect(opened).toHaveBeenCalledTimes(1);
  });

  test('normalizes removal and completed closing transitions to route.close', () => {
    const route = createRoute({ path: '/profile' });
    const closed = vi.fn();
    route.close.watch(closed);
    const listeners = createRouteListeners(route);
    const preventDefault = vi.fn();

    listeners.beforeRemove({ preventDefault });
    createClosingTransitionListener(route)({ data: { closing: true } });
    listeners.gestureEnd();

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(closed).toHaveBeenCalledTimes(3);
  });

  test('tab press prevents native selection and opens Router route', () => {
    const route = createRoute({ path: '/profile' });
    const opened = vi.fn();
    route.open.watch(opened);
    const preventDefault = vi.fn();

    createTabPressListener(route)({ preventDefault });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(opened).toHaveBeenCalledTimes(1);
  });
});
