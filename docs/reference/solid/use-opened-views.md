# useOpenedViews

Returns a Solid accessor containing the currently opened views from a supplied list.

## API

```ts
function useOpenedViews(routes: RouteView[]): Accessor<RouteView[]>;
```

```tsx
import { useOpenedViews } from '@effector/router-solid';

function OpenedViewCount() {
  const openedViews = useOpenedViews(routeViews);
  return <p>{openedViews().length} opened views</p>;
}
```

The hook:

- reads `$isOpened` for a route and `$activeRoutes` for a router;
- removes an active parent view when an active child view is present;
- preserves the declaration order of the supplied array.

[`createRoutesView`] and [`Outlet`] select the last item from this accessor. The hook reads supplied units directly and does not require router context.

[`createRoutesView`]: /solid/create-routes-view
[`Outlet`]: /solid/outlet
