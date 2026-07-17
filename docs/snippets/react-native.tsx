import type {
  NavigationContainerRefWithCurrent,
  ParamListBase,
} from '@react-navigation/native';
import type {
  NativeNavigator,
  NativeNavigatorProps,
} from '@effector/router-react-native';
import type { ReactElement } from 'react';

const navigationRef =
  undefined as unknown as NavigationContainerRefWithCurrent<ParamListBase>;
const props: NativeNavigatorProps = { navigationRef };
const Navigator: NativeNavigator = () => ({}) as ReactElement;

export function NativeQuickStart() {
  return <Navigator {...props} />;
}
