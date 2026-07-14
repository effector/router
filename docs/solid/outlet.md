# Outlet

Renders the selected opened child of the current route view.

## Usage

```tsx
import {
  createRouteView,
  createRoutesView,
  Outlet,
} from '@effector/router-solid';

const ProfileScreen = createRouteView({
  route: profileRoute,
  view: () => (
    <main>
      <h1>Profile</h1>
      <Outlet />
    </main>
  ),
  children: [
    createRouteView({ route: settingsRoute, view: SettingsPage }),
    createRouteView({ route: friendsRoute, view: FriendsPage }),
  ],
});

const RoutesView = createRoutesView({ routes: [ProfileScreen] });
```

[`createRoutesView`] provides the selected top-level view's `children`. `Outlet` filters those direct children with [`useOpenedViews`] and renders the last opened match. With the current implementation, an `Outlet` does not provide a new child context for another nested `Outlet`; treat the documented contract as one level until recursive nesting is implemented.

[`createRoutesView`]: /solid/create-routes-view
[`useOpenedViews`]: /solid/use-opened-views
