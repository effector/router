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
const nativeProps: NativeNavigatorProps = { navigationRef };
// @ts-expect-error NativeNavigator always requires the app-owned ref prop
const missingRef: NativeNavigatorProps = {};

const stack: NativeNavigator = undefined as unknown as StackResult;
const tabs: NativeNavigator = undefined as unknown as TabsResult;
void nativeProps;
void missingRef;
void stack;
void tabs;
