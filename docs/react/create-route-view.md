# createRouteView

Creates a route view that connects an effector/router Router route to a React component.

## Import

```ts
import { createRouteView } from '@effector/router-react';
```

## Usage

```tsx
import { createRouteView } from '@effector/router-react';
import { profileRoute } from './routes';

function ProfileComponent() {
  return <div>Profile Page</div>;
}

export const ProfileScreen = createRouteView({
  route: profileRoute,
  view: ProfileComponent,
});
```

## With Layout

Wrap the view with a layout component:

```tsx
import { createRouteView } from '@effector/router-react';
import { profileRoute } from './routes';
import { MainLayout } from './layouts';

function ProfileComponent() {
  return <div>Profile Page</div>;
}

export const ProfileScreen = createRouteView({
  route: profileRoute,
  view: ProfileComponent,
  layout: MainLayout,
});
```

## With Nested Routes

Create nested route structures using children:

```tsx
import { createRouteView } from '@effector/router-react';
import { profileRoute, settingsRoute } from './routes';

export const ProfileScreen = createRouteView({
  route: profileRoute,
  view: ProfileComponent,
  children: [
    createRouteView({
      route: settingsRoute,
      view: SettingsComponent,
    }),
  ],
});
```

Use `Outlet` component in the parent view to render children:

```tsx
import { Outlet } from '@effector/router-react';

function ProfileComponent() {
  return (
    <div>
      <h1>Profile</h1>
      <Outlet /> {/* Renders active child route */}
    </div>
  );
}
```

### With a Nested Router

An eager route view can also target a `Router`. The view is active whenever that router has at least one active route, which is useful for mounting a nested routes view under a parent `Outlet`:

```tsx
import { createRoutesView, createRouteView } from '@effector/router-react';
import { createRouter } from '@effector/router';

const profileRouter = createRouter({
  routes: [friendsRoute, settingsRoute],
});

const ProfileRoutesView = createRoutesView({
  routes: [
    createRouteView({ route: friendsRoute, view: FriendsComponent }),
    createRouteView({ route: settingsRoute, view: SettingsComponent }),
  ],
});

const ProfileRouterView = createRouteView({
  route: profileRouter,
  view: ProfileRoutesView,
});
```

This contract applies to `createRouteView`. Do not pass a `Router` to `createLazyRouteView`; lazy router targets are not currently implemented.

## Configuration

### `route` (required)

An effector/router `Route` created with `createRoute`, or a `Router` created with `createRouter`:

```tsx
import { createRoute } from '@effector/router';

const profileRoute = createRoute({ path: '/profile' });

const ProfileScreen = createRouteView({
  route: profileRoute,
  view: ProfileComponent,
});
```

### `view` (required)

The React component to render when the route is active:

```tsx
const ProfileScreen = createRouteView({
  route: profileRoute,
  view: () => <div>Profile</div>,
});

// Or with a named component
function ProfileComponent() {
  return <div>Profile</div>;
}

const ProfileScreen = createRouteView({
  route: profileRoute,
  view: ProfileComponent,
});
```

### `layout` (optional)

A layout component to wrap the view:

```tsx
function MainLayout({ children }) {
  return (
    <div>
      <header>Header</header>
      {children}
      <footer>Footer</footer>
    </div>
  );
}

const ProfileScreen = createRouteView({
  route: profileRoute,
  view: ProfileComponent,
  layout: MainLayout,
});
```

### `children` (optional)

Nested route views:

```tsx
const ProfileScreen = createRouteView({
  route: profileRoute,
  view: ProfileComponent,
  children: [
    createRouteView({ route: settingsRoute, view: SettingsComponent }),
    createRouteView({ route: friendsRoute, view: FriendsComponent }),
  ],
});
```

## Return Value

Returns a `RouteView` object with:

- `route` - The route or router instance
- `view` - The wrapped React component
- `children` (optional) - Nested route views

## Type Safety

Route parameters are type-safe when accessing in the component:

```tsx
import { useUnit } from 'effector-react';
import { createRoute } from '@effector/router';

const userRoute = createRoute({ path: '/user/:id' });

const UserScreen = createRouteView({
  route: userRoute,
  view: () => {
    const params = useUnit(userRoute.$params);
    return <div>User ID: {params.id}</div>; // params.id is typed as string
  },
});
```

## See Also

- [createLazyRouteView](./create-lazy-route-view) - Lazy-loaded route views
- [createRoutesView](./create-routes-view) - Render active routes
- [Outlet](./outlet) - Render nested routes
- [withLayout](./with-layout) - Apply layouts to multiple routes
