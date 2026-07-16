import type {
  NavigationContainerRefWithCurrent,
  ParamListBase,
} from '@react-navigation/native';
import type * as React from 'react';

/** Ref owned by the application and shared with NavigationContainer. */
export type NativeNavigatorProps<
  ParamList extends ParamListBase = ParamListBase,
> = {
  navigationRef: NavigationContainerRefWithCurrent<ParamList>;
};

/** Public shape returned by the native navigator factories. */
export type NativeNavigator = {
  <ParamList extends ParamListBase = ParamListBase>(
    props: NativeNavigatorProps<ParamList>,
  ): React.ReactElement;
};
