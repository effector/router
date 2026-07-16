# Stack Navigator

Creates a Stack Navigator that integrates effector/router Router with React Navigation's Stack Navigator.

## Import

```ts
import { createStackNavigator } from '@effector/router-react-native';
```

## Usage

```tsx
import {
  createNavigationContainerRef,
  NavigationContainer,
} from '@react-navigation/native';
import { createStackNavigator } from '@effector/router-react-native';
import { createRouter, createRoute } from '@effector/router';
import { createRouteView, RouterProvider } from '@effector/router-react';

const homeRoute = createRoute({ path: '/home' });
const detailsRoute = createRoute({ path: '/details/:id' });

const router = createRouter({
  routes: [homeRoute, detailsRoute],
});

const HomeScreen = createRouteView({
  route: homeRoute,
  view: () => (
    <View>
      <Text>Home Screen</Text>
      <Button
        title="Go to Details"
        onPress={() => detailsRoute.open({ params: { id: '123' } })}
      />
    </View>
  ),
});

const DetailsScreen = createRouteView({
  route: detailsRoute,
  view: () => {
    const params = useUnit(detailsRoute.$params);
    return <Text>Details: {params.id}</Text>;
  },
});

const StackNavigator = createStackNavigator({
  router,
  routes: [HomeScreen, DetailsScreen],
  screenOptions: {
    headerStyle: { backgroundColor: '#f4511e' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' },
  },
});
const navigationRef = createNavigationContainerRef();

export default function App() {
  return (
    <RouterProvider router={router}>
      <NavigationContainer ref={navigationRef}>
        <StackNavigator navigationRef={navigationRef} />
      </NavigationContainer>
    </RouterProvider>
  );
}
```

## Configuration

The factory returns the navigator component directly. `navigationRef` is
required and must be created and owned by the application, then passed to both
`NavigationContainer` and the returned component:

```tsx
const navigationRef = createNavigationContainerRef();

<NavigationContainer ref={navigationRef}>
  <StackNavigator navigationRef={navigationRef} />
</NavigationContainer>;
```

The binding listens for native readiness/state changes and removes those
listeners on unmount. It does not create a `NavigationContainer`, Router, or
history adapter.

### `router` (required)

effector/router Router instance created with [`createRouter`].

```tsx
const router = createRouter({
  routes: [homeRoute, profileRoute],
});

const StackNavigator = createStackNavigator({
  router,
  routes: [HomeScreen, ProfileScreen],
});
```

### `routes` (required)

Array of route views created with [`createRouteView`] or [`createLazyRouteView`].

```tsx
const HomeScreen = createRouteView({
  route: homeRoute,
  view: () => <Text>Home</Text>,
});

const StackNavigator = createStackNavigator({
  router,
  routes: [HomeScreen, ProfileScreen],
});
```

### `screenOptions`

Options applied to all screens. Accepts all React Navigation Stack Navigator options.

```tsx
const StackNavigator = createStackNavigator({
  router,
  routes: [HomeScreen, ProfileScreen],
  screenOptions: {
    // Header
    headerShown: true,
    headerTitle: 'My App',
    headerStyle: { backgroundColor: '#f4511e' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' },

    // Gestures
    gestureEnabled: true,
    gestureDirection: 'horizontal',

    // Card
    cardStyle: { backgroundColor: '#fff' },
    presentation: 'card', // or 'modal', 'transparentModal'

    // Animation
    animationEnabled: true,
  },
});
```

See [React Navigation Stack Navigator documentation](https://reactnavigation.org/docs/stack-navigator) for all available options.

### Route view `options`

Per-screen options belong to the RN route view and use the native Stack option
object or callback type. They are passed directly to `Stack.Screen` without
being merged with `screenOptions`:

```tsx
const ProfileScreen = createRouteView({
  route: profileRoute,
  view: Profile,
});

const StackNavigator = createStackNavigator({
  router,
  routes: [
    {
      ...ProfileScreen,
      options: ({ route }) => ({ title: route.name }),
    },
  ],
});
```

### `initialRouteName`

Name of the route to render on initial render.

```tsx
const StackNavigator = createStackNavigator({
  router,
  routes: [HomeScreen, ProfileScreen],
  initialRouteName: '/home',
});
```

## Navigation

Navigate using effector/router Router route methods:

```tsx
// Open route
homeRoute.open();

// With parameters
profileRoute.open({ params: { id: '123' } });

// With query
homeRoute.open({ query: { tab: 'settings' } });

// Replace
profileRoute.open({ replace: true });
```

## Type Safety

Route parameters are type-safe:

```tsx
const userRoute = createRoute({ path: '/user/:id/:tab' });
// Type: Route<{ id: string; tab: string }>

userRoute.open({
  params: { id: '123', tab: 'posts' }, // ✅ Type-safe
});

userRoute.open({ params: { id: 123 } }); // ❌ Error: id must be string
```

[`createLazyRouteView`]: /react/create-lazy-route-view
[`createRouteView`]: /react/create-route-view
[`createRouter`]: /core/create-router
