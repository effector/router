# ☄️ @effector/router-react-native

[![npm](https://img.shields.io/npm/v/@effector/router-react-native.svg)](https://www.npmjs.com/package/@effector/router-react-native)

React Native bindings for [`@effector/router`](https://www.npmjs.com/package/@effector/router). Manage navigation
state with Effector while [React Navigation](https://reactnavigation.org/) renders the native UI — you keep its
native rendering, animations, and options, but navigate through route events.

## Install

```bash
npm install @effector/router @effector/router-react-native \
  @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs \
  react-native-screens react-native-safe-area-context
```

The package is the React Native entry point and re-exports
`@effector/router-react`. Import the shared router API from `@effector/router`.

## Quick start

```tsx
import { Text } from 'react-native';
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createRoute, createRouter } from '@effector/router';
import {
  RouterProvider,
  createRouteView,
  createStackNavigator,
} from '@effector/router-react-native';

// 1. Routes + router (owned by the app)
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
// 3. The app also owns the native ref and container.
const navigationRef = createNavigationContainerRef();

export default function App() {
  return (
    <RouterProvider router={router}>
      <NavigationContainer ref={navigationRef}>
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

Both accept React Navigation's `screenOptions` and RN-specific per-screen
`options` on route views, so styling and behavior stay fully configurable.
Object and callback values are passed through unchanged; stack and tabs retain
their distinct native option types. Navigation always flows through route events
(`route.open(...)`), which keeps logic centralized and easy to test.

The navigator factories return the native component directly. The app owns the
`NavigationContainer` and its ref, and passes that same `navigationRef` to the
navigator. The binding subscribes to the ref's `ready` and `state` notifications
and removes those subscriptions when the component unmounts.

The integration contract is exercised with an app-owned ref in
`packages/react-native/tests/integration.test.tsx`: direct component return,
complete screen names, native option callbacks, pre-ready latest-target
synchronization, params, native echo suppression, tab presses, and cleanup.

The binding is an adapter only: it does not create a Router, history adapter, or
`NavigationContainer`. Configure those in the application layer, pass the
application-owned `navigationRef` to both the container and navigator, and keep
route events as the navigation API.

## Documentation

Full guides and API reference: **[router.effector.dev/react-native](https://router.effector.dev/react-native)**

## License

[MIT](https://github.com/effector/router/blob/main/LICENSE)
