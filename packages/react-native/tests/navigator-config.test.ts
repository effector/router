import { expectTypeOf, test } from 'vitest';
import type {
  BottomTabsNavigatorConfig,
  StackNavigatorConfig,
} from '../lib';

test('navigator screenOptions accepts per-screen callbacks (#75)', () => {
  const stackScreenOptions: NonNullable<StackNavigatorConfig['screenOptions']> =
    ({ route }) => ({ title: route.name });
  const tabScreenOptions: NonNullable<
    BottomTabsNavigatorConfig['screenOptions']
  > = ({ route }) => ({ title: route.name });

  expectTypeOf(stackScreenOptions).toBeFunction();
  expectTypeOf(tabScreenOptions).toBeFunction();
});
