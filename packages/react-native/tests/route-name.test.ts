import { describe, expect, test } from 'vitest';
import { getScreenName } from '../lib/route-name';

describe('React Navigation screen names', () => {
  test('preserves path route names for initialRouteName compatibility (#74)', () => {
    expect(getScreenName({ path: '/home' }, 0)).toBe('/home');
    expect(getScreenName({ path: '/settings/profile' }, 1)).toBe(
      '/settings/profile',
    );
  });
});
