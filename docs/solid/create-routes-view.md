# createRoutesView

Creates a Solid component that renders the selected opened route view.

## API

```ts
function createRoutesView(props: {
  routes: RouteView[];
  otherwise?: Component;
}): Component;
```

## Usage

```tsx
import { createRouteView, createRoutesView } from '@effector/router-solid';

const RoutesView = createRoutesView({
  routes: [
    createRouteView({ route: homeRoute, view: HomePage }),
    createRouteView({ route: profileRoute, view: ProfilePage }),
  ],
  otherwise: () => <h1>Not found</h1>,
});
```

The component uses `useOpenedViews`, removes an active parent when its child is active, and renders the last remaining view in the supplied array. `otherwise` renders when no supplied view is open.

Create the route-view objects and `RoutesView` once at module scope so their identities remain stable. Add `RouterProvider` when rendered descendants use router context; `createRoutesView` itself reads the supplied route units directly.
