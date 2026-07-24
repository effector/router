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

The imported module must have a default component export. The importer starts
when Solid renders the lazy view. It is not registered with core and route
opening does not wait for the chunk, so the configured `Suspense` fallback is
observable.

Route/chained `$isPending` describes model preparation, not chunk loading. For
preload, reuse the importer in an ordinary Effect:

```tsx
import { createEffect } from 'effector';

const importProfile = () => import('./screens/ProfileScreen');
const preloadProfileFx = createEffect(importProfile);

const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: importProfile,
  fallback: ProfileSkeleton,
});
```

[`Outlet`]: /solid/outlet
