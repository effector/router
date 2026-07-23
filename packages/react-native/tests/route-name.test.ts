import { describe, expect, test } from 'vitest';
import {
  getRegisteredPath,
  getScreenName,
  hasRequiredRouteParams,
  hasRouteParams,
  validateBottomTabsRoutes,
  validateInitialRouteName,
} from '../lib/route-name';

describe('React Navigation screen names', () => {
  test('preserves path route names for initialRouteName compatibility (#74)', () => {
    expect(getScreenName({ path: '/home' }, 0)).toBe('/home');
    expect(getScreenName({ path: '/settings/profile' }, 1)).toBe(
      '/settings/profile',
    );
  });

  test('uses the complete parent path template', () => {
    const parent = { path: '/users/:userId' };
    const child = { path: '/settings', parent };

    expect(getRegisteredPath(child)).toBe('/users/:userId/settings');
    expect(getScreenName(child, 0)).toBe('/users/:userId/settings');
    expect(hasRouteParams(child)).toBe(true);
    expect(hasRequiredRouteParams(child)).toBe(true);
  });

  test('recognizes optional parameters as valid initial routes', () => {
    const route = { path: '/search/:term?' };

    expect(hasRouteParams(route)).toBe(true);
    expect(hasRequiredRouteParams(route)).toBe(false);
    expect(() =>
      validateInitialRouteName([{ route }], '/search/:term?'),
    ).not.toThrow();
  });

  test('rejects required initial params and parameterized tabs', () => {
    const route = { path: '/details/:id' };

    expect(() => validateInitialRouteName([{ route }], '/details/:id')).toThrow(
      /required params/,
    );
    expect(() => validateBottomTabsRoutes([{ route }])).toThrow(
      /Bottom Tabs cannot register parameterized route/,
    );
  });

  test('does not synthesize an index name for pathless routes', () => {
    expect(() => getScreenName({}, 4)).toThrow(/registered path template/);
  });
});
