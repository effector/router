# withLayout

Wraps multiple route-view components with the same Solid layout component.
Views returned by one call share a private group identity; switching between
them replaces only the page child and keeps the layout instance mounted.

## API

```ts
function withLayout(
  layout: Component<{ children: JSX.Element }>,
  views: RouteView[],
): RouteView[];
```

## Usage

```tsx
import {
  createRouteView,
  createRoutesView,
  withLayout,
} from '@effector/router-solid';

const RoutesView = createRoutesView({
  routes: withLayout(MainLayout, [
    createRouteView({ route: homeRoute, view: HomePage }),
    createRouteView({ route: profileRoute, view: ProfilePage }),
  ]),
});
```

The helper preserves `route`, `children`, and other route-view metadata. The
layout group identity is private to the binding and is not part of the core
RouteView contract.

[`createRouteView`]: /solid/create-route-view
[`Outlet`]: /solid/outlet
