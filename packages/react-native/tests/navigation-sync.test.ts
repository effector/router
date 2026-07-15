import { createRoute } from '@effector/router';
import type { RouteView } from '@effector/router-react';
import { describe, expect, test, vi } from 'vitest';
import { syncActiveRoute } from '../lib/navigation-sync';

describe('React Navigation synchronization', () => {
  test('navigates the real navigation object to the last active route (#71)', () => {
    const home = createRoute({ path: '/home' });
    const profile = createRoute({ path: '/profile' });
    const routes: RouteView[] = [
      { route: home, view: () => null },
      { route: profile, view: () => null },
    ];
    const navigate = vi.fn();

    syncActiveRoute({ navigate }, [home, profile], routes);

    expect(navigate).toHaveBeenCalledWith('/profile');
  });
});
