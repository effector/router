import { expectTypeOf, test } from 'vitest';
import type {
  BottomTabsNavigatorConfig,
  BottomTabsRouteView,
  StackNavigatorConfig,
  StackRouteView,
} from '../lib';

test('navigator screenOptions accepts per-screen callbacks (#75)', () => {
  const stackScreenOptions: NonNullable<
    StackNavigatorConfig['screenOptions']
  > = ({ route }) => ({ title: route.name });
  const tabScreenOptions: NonNullable<
    BottomTabsNavigatorConfig['screenOptions']
  > = ({ route }) => ({ title: route.name });

  expectTypeOf(stackScreenOptions).toBeFunction();
  expectTypeOf(tabScreenOptions).toBeFunction();
});

test('navigator route views accept native object and callback options', () => {
  const stackOptions: NonNullable<StackRouteView['options']> = ({ route }) => ({
    title: route.name,
  });
  const tabOptions: NonNullable<BottomTabsRouteView['options']> = {
    tabBarLabel: 'Home',
  };

  expectTypeOf(stackOptions).toBeFunction();
  expectTypeOf(tabOptions).toMatchTypeOf<BottomTabsRouteView['options']>();
});
