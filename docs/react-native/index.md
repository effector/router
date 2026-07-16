# React Native

React Native bindings for effector router with React Navigation integration.

## Overview

`@effector/router-react-native` bridges [Effector Router](https://router.effector.dev/)'s state management with [React Navigation](https://reactnavigation.org/)'s native UI components. This package allows you to:

- Manage navigation state with effector router
- Render UI with React Navigation's native navigators
- Access the full React Navigation API and styling options
- Navigate declaratively through route events

## How It Works

```
┌─────────────────┐
│ effector router │  ← Manages state
└────────┬────────┘
         │ syncs
         ▼
┌─────────────────┐
│ React Navigation│  ← Renders UI
│   (Stack/Tabs)  │
└─────────────────┘
```

1. **Effector router** manages which routes are open, their parameters, and navigation state
2. **React Navigation** handles UI rendering, animations, gestures, and platform-specific behavior
3. The adapters **sync state** between both systems

## Installation

```bash
npm install @effector/router-react-native @effector/router @effector/router-react \
  @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs

# Also install React Navigation dependencies
npm install react-native-screens react-native-safe-area-context
```

## Quick Example

```tsx
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createStackNavigator } from '@effector/router-react-native';
import { createRouter, createRoute } from '@effector/router';
import { createRouteView, RouterProvider } from '@effector/router-react';

// 1. Define routes
const homeRoute = createRoute({ path: '/home' });
const detailsRoute = createRoute({ path: '/details/:id' });

// 2. Create router
const router = createRouter({
  routes: [homeRoute, detailsRoute],
});

// 3. Create screens
const HomeScreen = createRouteView({
  route: homeRoute,
  view: () => <Text>Home Screen</Text>,
});

const DetailsScreen = createRouteView({
  route: detailsRoute,
  view: () => <Text>Details Screen</Text>,
});

// 4. Create navigator
const StackNavigator = createStackNavigator({
  router,
  routes: [HomeScreen, DetailsScreen],
  screenOptions: {
    headerStyle: { backgroundColor: '#f4511e' },
  },
});
const navigationRef = createNavigationContainerRef();

// 5. Use in app
export default function App() {
  return (
    <RouterProvider router={router}>
      <NavigationContainer ref={navigationRef}>
        <StackNavigator navigationRef={navigationRef} />
      </NavigationContainer>
    </RouterProvider>
  );
}

// 6. Navigate programmatically
homeRoute.open();
detailsRoute.open({ params: { id: '123' } });
```

## Available Navigators

### [Stack Navigator](/react-native/stack-navigator)

Full-screen navigation with stack-based transitions. Perfect for hierarchical navigation patterns.

```tsx
import { createStackNavigator } from '@effector/router-react-native';

const StackNavigator = createStackNavigator({
  router,
  routes: [HomeScreen, DetailsScreen],
});
```

### [Bottom Tabs Navigator](/react-native/bottom-tabs-navigator)

Tab-based navigation with a bottom tab bar. Ideal for primary app navigation.

```tsx
import { createBottomTabsNavigator } from '@effector/router-react-native';

const TabsNavigator = createBottomTabsNavigator({
  router,
  routes: [HomeTab, SearchTab, ProfileTab],
});
```

## Navigation Approach

All navigation happens through **Effector Router**, not React Navigation directly:

```tsx
// ✅ Navigate via effector router
homeRoute.open();
detailsRoute.open({ params: { id: '123' } });

// ❌ Don't use React Navigation's navigation prop
navigation.navigate('Details'); // Avoid this
```

This approach provides:

- Centralized navigation logic
- Easy testing (trigger events in tests)
- Router-owned state and deterministic route events

The app owns `NavigationContainer` and its `navigationRef`. Pass the same ref to
the navigator component returned by `createStackNavigator` or
`createBottomTabsNavigator`; the binding does not create a container, Router, or
history adapter. It subscribes to native `ready` and `state` notifications,
reads a complete root snapshot from the ref, handles an already-ready ref, and
cleans up listeners on unmount.

Screen names are complete registered path templates, including parent segments
(for example, `/users/:userId/settings`); no positional/index fallback is
generated. A route with required path parameters cannot be selected through
`initialRouteName` and must be opened by Router with real params.

Router-to-native synchronization is readiness-gated. Before the app-owned ref
is ready, the binding retains only the latest Router target and sends no native
command. Once ready, it navigates with route params and preserves Router's
replace intent; native state notifications are treated as complete snapshots
and matching binding-originated updates are not echoed back.

## React Navigation Features

While navigation is managed by Effector Router, you still get all React Navigation features:

- Native animations and transitions
- Gesture handling (swipe back, etc.)
- Header customization
- Tab bar customization
- Deep linking support
- Screen options and configuration
- Platform-specific behavior

## Type Safety

Route parameters are automatically inferred:

```tsx
const userRoute = createRoute({ path: '/user/:id/:tab' });
// Type: Route<{ id: string; tab: string }>

// ✅ Type-safe
userRoute.open({ params: { id: '123', tab: 'posts' } });

// ❌ TypeScript error
userRoute.open({ params: { id: 123 } }); // id must be string
```

## Next Steps

- [Stack Navigator API](/react-native/stack-navigator) - Full-screen navigation
- [Bottom Tabs Navigator API](/react-native/bottom-tabs-navigator) - Tab-based navigation
- [Core Package](/core/create-router) - Learn about effector router core concepts
- [React Package](/react/create-route-view) - React-specific utilities
