# createLazyRouteView

Creates a lazy `RouteView` with Solid `lazy` and `Suspense`.

## API

```ts
function createLazyRouteView<T extends object | void = void>(
  props: CreateLazyRouteViewProps<T>,
): RouteView;
```

| Property   | Type                                    | Description                                |
| ---------- | --------------------------------------- | ------------------------------------------ |
| `route`    | `Route<T> \| Router`                    | Unit that controls whether the view opens  |
| `view`     | `() => Promise<{ default: Component }>` | Dynamic import with a default export       |
| `fallback` | `Component`                             | Optional Suspense fallback                 |
| `layout`   | `Component<{ children: JSX.Element }>`  | Optional wrapper component                 |
| `children` | `RouteView[]`                           | Optional direct child views for [`Outlet`] |

## Usage

```tsx
import { createLazyRouteView } from '@effector/router-solid';

const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./screens/ProfileScreen'),
  fallback: () => <p>Loading profile...</p>,
  layout: MainLayout,
});
```

The imported module must have a default component export. For a normal route, the dynamic import is also registered with the route, so route opening waits for the bundle. A `Router` target is rendered through Solid lazy loading but does not receive a route-level async import hook.

[`Outlet`]: /solid/outlet
