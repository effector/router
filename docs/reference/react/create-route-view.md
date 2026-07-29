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

## With Fallbacks

A route view can also describe what to render while its route is _not_ opened:

```tsx
export const ProfileScreen = createRouteView({
  route: profileRoute,
  view: ProfileComponent,
  loading: ProfileSkeleton, // route is pending
  closed: ProfilePlaceholder, // route is closed
});
```

`loading` covers the wait for data — a route with `beforeOpen`, or the
[`chainRoute`] output that stays pending until its preparation resolves — and,
for [`createLazyRouteView`], the wait for the chunk. `closed` covers the plain
closed state.

Both are resolved by the surrounding [`createRoutesView`] or [`Outlet`], which
still renders a single view. The order is:

1. the deepest **opened** view, if any of the listed views is opened;
2. otherwise the `loading` of a **pending** view;
3. otherwise the `closed` of a closed view;
4. otherwise the `otherwise` prop of [`createRoutesView`] (`null` inside an
   [`Outlet`]).

Later declarations win between equal candidates, mirroring how an opened
sibling is selected. Because an opened view always wins, `loading` never
replaces a page that is already on screen — a route that re-opens with new
parameters keeps rendering `view`.

This composes the skeleton pattern for nested routes: keep the parent view
mounted and let its `Outlet` render the child's `loading` while the child chain
prepares.

```tsx
const settingsReady = chainRoute({
  route: settingsRoute,
  beforeOpen: loadSettingsFx,
});

export const ProfileScreen = createRouteView({
  route: profileRoute,
  view: ProfileComponent, // renders <Outlet />
  children: [
    createRouteView({
      route: settingsReady,
      view: SettingsComponent,
      loading: SettingsSkeleton,
    }),
  ],
});
```

Fallbacks are wrapped by the same `layout` as the view, and by the
[`withLayout`] group of the view, so the layout stays mounted while the
fallback swaps to the page.

::: tip
A view listed in `createRoutesView` that declares `closed` renders that
component for _every_ state in which nothing else is opened, including an
unmatched URL. Keep the not-found screen in the `otherwise` of
`createRoutesView`, and use a per-view `closed` where the view owns its slot —
inside an `Outlet`, or in a routes view with a single entry.
:::

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

Use [`Outlet`] component in the parent view to render children:

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

An eager route view can also target a `Router`. The view is active whenever that router has at least one active route, which is useful for mounting a nested routes view under a parent [`Outlet`]:

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

This contract applies to `createRouteView`. Do not pass a `Router` to [`createLazyRouteView`]; lazy router targets are not currently implemented.

## Configuration

### `route` (required)

An effector/router `Route` created with [`createRoute`], or a `Router` created with [`createRouter`]:

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

### `closed` (optional)

A component rendered instead of `view` while the route is not opened:

```tsx
const ProfileScreen = createRouteView({
  route: profileRoute,
  view: ProfileComponent,
  closed: () => <div>Pick a profile</div>,
});
```

### `loading` (optional)

A component rendered while the route is pending — `route.$isPending`, which
covers `beforeOpen` effects and a [`chainRoute`] preparation:

```tsx
const ProfileScreen = createRouteView({
  route: profileReady,
  view: ProfileComponent,
  loading: ProfileSkeleton,
});
```

An opened view wins over any fallback, so `loading` shows only while nothing in
the same routes view or `Outlet` is opened.

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

## `CreateRouteViewProps`

`CreateRouteViewProps<T>` is the public configuration type accepted by `createRouteView`.

```ts
import type { CreateRouteViewProps } from '@effector/router-react';
```

| Property   | Type                                     | Description                                                          |
| ---------- | ---------------------------------------- | -------------------------------------------------------------------- |
| `route`    | `Route<T>` or `Router`                   | The route or nested router that controls whether the view is active. |
| `view`     | `ComponentType`                          | Component rendered for the active view.                              |
| `layout`   | `ComponentType<{ children: ReactNode }>` | Optional layout that wraps the view and its fallbacks.               |
| `closed`   | `ComponentType`                          | Optional component rendered while the route is not opened.           |
| `loading`  | `ComponentType`                          | Optional component rendered while the route is pending.              |
| `children` | `RouteView[]`                            | Optional direct child views rendered through [`Outlet`].             |

## Return Value

Returns a [`RouteView`](#routeview) object.

## `RouteView`

`RouteView` is the public description of a route-bound view. Both `createRouteView` and [`createLazyRouteView`] return this type, and `createRoutesView`, `withLayout`, and `useOpenedViews` accept or return collections of it.

```ts
import type { RouteView } from '@effector/router-react';
```

| Property   | Type                          | Description                                        |
| ---------- | ----------------------------- | -------------------------------------------------- |
| `route`    | Route-like target or `Router` | Target that determines whether the view is active. |
| `view`     | `React.FC`                    | Component rendered when selected.                  |
| `children` | `RouteView[]`                 | Optional direct child views for [`Outlet`].        |

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

[`chainRoute`]: /core/chain-route
[`createLazyRouteView`]: /react/create-lazy-route-view
[`createRoute`]: /core/create-route
[`createRouter`]: /core/create-router
[`createRoutesView`]: /react/create-routes-view
[`Outlet`]: /react/outlet
[`withLayout`]: /react/with-layout
