# createRouteView

Creates a route view that connects a route to a React component.

`createRouteView` is re-exported from `@effector/router-react`; its API and behavior are identical in React Native.

## Import

```tsx
import { createRouteView } from '@effector/router-react-native';
```

## Original documentation

See [createRouteView in the React API](/react/create-route-view) for its configuration, types, and examples.

## Fallbacks in React Native

The `closed` and `loading` components are resolved by
[`createRoutesView`](/react-native/create-routes-view) and
[`Outlet`](/react-native/outlet), so they work the same way when you render
route views yourself.

[`createStackNavigator`](/react-native/stack-navigator) and
[`createBottomTabsNavigator`](/react-native/bottom-tabs-navigator) mount every
route view as a `@react-navigation` screen and let the navigator decide what is
visible, so those navigators render `view` only and ignore both fallbacks.
Render a skeleton from inside the screen component there.
