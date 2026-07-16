import type {
  NavigationContainerRefWithCurrent,
  ParamListBase,
} from '@react-navigation/native';
import { expectTypeOf, test } from 'vitest';
import type { NativeNavigator, NativeNavigatorProps } from '../lib';
import { createBottomTabsNavigator, createStackNavigator } from '../lib';

type StackResult = ReturnType<typeof createStackNavigator>;
type TabsResult = ReturnType<typeof createBottomTabsNavigator>;

test('native navigators require an app-owned navigation ref', () => {
  expectTypeOf<{
    navigationRef: NavigationContainerRefWithCurrent<ParamListBase>;
  }>().toMatchTypeOf<NativeNavigatorProps>();

  // @ts-expect-error NativeNavigator always requires the app-owned ref prop
  const missingRef: NativeNavigatorProps = {};
  expectTypeOf(missingRef).toMatchTypeOf<NativeNavigatorProps>();
});

test('navigator factories return NativeNavigator components', () => {
  expectTypeOf<StackResult>().toMatchTypeOf<NativeNavigator>();
  expectTypeOf<TabsResult>().toMatchTypeOf<NativeNavigator>();
});
