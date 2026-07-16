# ☄️ @effector/router-react-native

[![npm](https://img.shields.io/npm/v/@effector/router-react-native.svg)](https://www.npmjs.com/package/@effector/router-react-native)

React Native bindings for [`@effector/router`](https://www.npmjs.com/package/@effector/router). Manage navigation
state with Effector while [React Navigation](https://reactnavigation.org/) renders the native UI — you keep all its
animations, gestures, and options, but navigate through route events.

## Install

```bash
npm install @effector/router-react-native @effector/router @effector/router-react \
  @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs \
  react-native-screens react-native-safe-area-context
```

## Quick start

```tsx
import { Text } from 'react-native';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createStackNavigator } from '@effector/router-react-native';
import { createRoute, createRouter } from '@effector/router';
import { RouterProvider, createRouteView } from '@effector/router-react';

// 1. Routes + router
const home = createRoute({ path: '/home' });
const details = createRoute({ path: '/details/:id' });
const router = createRouter({ routes: [home, details] });

// 2. Screens
const HomeScreen = createRouteView({
  route: home,
  view: () => <Text>Home</Text>,
});
const DetailsScreen = createRouteView({
  route: details,
  view: () => <Text>Details</Text>,
});

// 3. Native navigator driven by the router
const Stack = createStackNavigator({
  router,
  routes: [HomeScreen, DetailsScreen],
});
const navigationRef = createNavigationContainerRef();

export default function App() {
  return (
    <RouterProvider router={router}>
      <NavigationContainer>
        <Stack navigationRef={navigationRef} />
      </NavigationContainer>
    </RouterProvider>
  );
}

// 4. Navigate through effector router — not the navigation prop
home.open();
details.open({ params: { id: '123' } });
```

## Navigators

- `createStackNavigator` — stack-based, full-screen transitions.
- `createBottomTabsNavigator` — tab bar navigation.

Both accept React Navigation's `screenOptions` and per-screen options, so styling and behavior stay fully
configurable. Navigation always flows through route events (`route.open(...)`), which keeps logic centralized and
easy to test.

The navigator factories return the native component directly. The app owns the
`NavigationContainer` and its ref, and passes that same `navigationRef` to the
navigator. The binding subscribes to the ref's `ready` and `state` notifications
and removes those subscriptions when the component unmounts.

## Documentation

Full guides and API reference: **[router.effector.dev/react-native](https://router.effector.dev/react-native)**

## License

[MIT](https://github.com/effector/router/blob/main/LICENSE)
