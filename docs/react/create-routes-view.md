# createRoutesView

Creates a component that renders the currently active route view.

The binding matrix covers path and virtual routes, parent/child suppression,
nested `Router` targets, declarative sibling priority, persistent layouts, and
lazy views with the same recursive `children` contract.

## Import

```ts
import { createRoutesView } from '@effector/router-react';
```

## Usage

```tsx
import { createRoutesView } from '@effector/router-react';
import { HomeScreen, ProfileScreen, SettingsScreen } from './screens';

const RoutesView = createRoutesView({
  routes: [HomeScreen, ProfileScreen, SettingsScreen],
});

function App() {
  return (
    <RouterProvider router={router}>
      <RoutesView />
    </RouterProvider>
  );
}
```

## With Fallback

Show a component when no routes match:

```tsx
function NotFoundScreen() {
  return <div>404 - Page not found</div>;
}

const RoutesView = createRoutesView({
  routes: [HomeScreen, ProfileScreen],
  otherwise: NotFoundScreen,
});
```

## Configuration

### `routes` (required)

Array of route views created with [`createRouteView`] or [`createLazyRouteView`]:

```tsx
import { createRouteView } from '@effector/router-react';

const HomeScreen = createRouteView({
  route: homeRoute,
  view: () => <div>Home</div>,
});

const ProfileScreen = createRouteView({
  route: profileRoute,
  view: () => <div>Profile</div>,
});

const RoutesView = createRoutesView({
  routes: [HomeScreen, ProfileScreen],
});
```

### `otherwise` (optional)

Component to render when no routes are active:

```tsx
const RoutesView = createRoutesView({
  routes: [HomeScreen, ProfileScreen],
  otherwise: () => <div>404 - Not Found</div>,
});
```

## Return Value

Returns a React component that:

- Renders the most recently opened route
- Automatically updates when route state changes
- Handles nested routes via [`Outlet`]
- Returns `null` or fallback when no routes are active

## How It Works

The routes view:

1. Uses [`useOpenedViews`] to track which routes are currently open
2. Renders the last declared active route after parent suppression
3. Provides outlet context for nested routes
4. Re-renders automatically when route state changes

## Avoid Full-Page Remounts

Create route views and the `RoutesView` component once at module scope. Recreating them inside a component render produces new component identities and subscriptions:

```tsx
const HomeScreen = createRouteView({
  route: homeRoute,
  view: HomeComponent,
});

const ProfileScreen = createRouteView({
  route: profileRoute,
  view: ProfileComponent,
});

const RoutesView = createRoutesView({
  routes: [HomeScreen, ProfileScreen],
});
```

Keep persistent application chrome outside `RoutesView`, so changing the selected route replaces only the page content:

```tsx
function App() {
  return (
    <AppLayout>
      <RoutesView />
    </AppLayout>
  );
}
```

For nested navigation, keep the persistent parent UI in a parent route view and render changing child content through [`Outlet`]. The parent view stays mounted while sibling child routes change. `withLayout` also keeps one layout instance mounted while views from the same call switch; a separate call creates a separate group.

## Nested Routes

For nested route structures, use [`Outlet`] in parent components:

```tsx
import { Outlet } from '@effector/router-react';

const ProfileScreen = createRouteView({
  route: profileRoute,
  view: () => (
    <div>
      <h1>Profile</h1>
      <nav>{/* Navigation */}</nav>
      <Outlet /> {/* Renders child routes */}
    </div>
  ),
  children: [
    createRouteView({ route: settingsRoute, view: SettingsComponent }),
    createRouteView({ route: friendsRoute, view: FriendsComponent }),
  ],
});

const RoutesView = createRoutesView({
  routes: [ProfileScreen],
});
```

## With Router Provider

[`RouterProvider`] must wrap the routes view:

```tsx
import { RouterProvider } from '@effector/router-react';
import { router } from './router';

const RoutesView = createRoutesView({
  routes: [HomeScreen, ProfileScreen],
});

function App() {
  return (
    <RouterProvider router={router}>
      <RoutesView />
    </RouterProvider>
  );
}
```

## Multiple Routes Views

You can create multiple routes views for different parts of your app:

```tsx
const MainRoutesView = createRoutesView({
  routes: [HomeScreen, AboutScreen],
});

const AdminRoutesView = createRoutesView({
  routes: [DashboardScreen, UsersScreen],
});

function App() {
  return (
    <RouterProvider router={router}>
      <MainRoutesView />
      <AdminRoutesView />
    </RouterProvider>
  );
}
```

## See Also

- [createRouteView](./create-route-view) - Create route views
- [createLazyRouteView](./create-lazy-route-view) - Lazy-loaded route views
- [RouterProvider](./router-provider) - Provide router to React tree
- [Outlet](./outlet) - Render nested routes
- [useOpenedViews](./use-opened-views) - Hook to track opened routes

[`createLazyRouteView`]: /react/create-lazy-route-view
[`createRouteView`]: /react/create-route-view
[`Outlet`]: /react/outlet
[`RouterProvider`]: /react/router-provider
[`useOpenedViews`]: /react/use-opened-views
[`withLayout`]: /react/with-layout
