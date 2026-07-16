import type {
  NavigationContainerRefWithCurrent,
  ParamListBase,
} from '@react-navigation/native';
import type { NativeNavigator, NativeNavigatorProps } from '../lib';
import { createBottomTabsNavigator, createStackNavigator } from '../lib';

type StackResult = ReturnType<typeof createStackNavigator>;
type TabsResult = ReturnType<typeof createBottomTabsNavigator>;

const navigationRef =
  undefined as unknown as NavigationContainerRefWithCurrent<ParamListBase>;
({ navigationRef }) satisfies NativeNavigatorProps;
// @ts-expect-error NativeNavigator always requires the app-owned ref prop
({}) satisfies NativeNavigatorProps;

undefined as unknown as StackResult satisfies NativeNavigator;
undefined as unknown as TabsResult satisfies NativeNavigator;
