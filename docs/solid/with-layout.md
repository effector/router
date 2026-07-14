# withLayout

Wraps multiple route-view components with the same Solid layout component.

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

The current helper returns new objects containing `route` and the wrapped `view`. It does not preserve `children`, so use it only for leaf views. For a parent view with an `Outlet`, pass `layout` directly to `createRouteView` until metadata-preserving transforms are implemented.
