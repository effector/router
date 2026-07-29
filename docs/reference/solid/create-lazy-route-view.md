# createLazyRouteView

Creates a lazy `RouteView` with Solid `lazy` and `Suspense`.

## API

```ts
function createLazyRouteView<T extends object | void = void>(
  props: CreateLazyRouteViewProps<T>,
): RouteView;
```

| Property    | Type                                    | Description                                                                      |
| ----------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| `route`     | `Route<T> \| Router`                    | Unit that controls whether the view opens                                        |
| `view`      | `() => Promise<{ default: Component }>` | Dynamic import with a default export                                             |
| `loading`   | `Component`                             | Optional component rendered while the route is pending and while the chunk loads |
| `fallback`  | `Component`                             | **Deprecated** — alias of `loading`, used when `loading` is absent               |
| `otherwise` | `Component`                             | Optional component rendered while it is closed                                   |
| `layout`    | `Component<{ children: JSX.Element }>`  | Optional wrapper component                                                       |
| `children`  | `RouteView[]`                           | Optional direct child views for [`Outlet`]                                       |

## `CreateLazyRouteViewProps`

`CreateLazyRouteViewProps<T>` is the exported public input type for `createLazyRouteView`. Its fields are the properties in the table above; `T` is the route parameter type. Its `view` loader must resolve to a module whose default export is a Solid component.

## Usage

```tsx
import { createLazyRouteView } from '@effector/router-solid';

const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./screens/ProfileScreen'),
  loading: () => <p>Loading profile...</p>,
  layout: MainLayout,
});
```

The imported module must have a default component export. The importer starts
when Solid renders the lazy view. It is not registered with core and route
opening does not wait for the chunk, so the configured `Suspense` fallback is
observable.

Route/chained `$isPending` describes model preparation, not chunk loading.
`loading` spans both — the pending route (see
[route view fallbacks](/solid/create-route-view#fallbacks)) and the chunk — so
the routes view `otherwise`, usually the not-found screen, no longer flashes
between them:

```tsx
const ProfileScreen = createLazyRouteView({
  route: profileReady,
  view: () => import('./screens/ProfileScreen'),
  loading: ProfileSkeleton,
});
```

`fallback` is deprecated: it is an alias of `loading` now, used when `loading` is
absent, and the type is marked `@deprecated` so editors point at the
replacement.

For preload, reuse the importer in an ordinary Effect:

```tsx
import { createEffect } from 'effector';

const importProfile = () => import('./screens/ProfileScreen');
const preloadProfileFx = createEffect(importProfile);

const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: importProfile,
  loading: ProfileSkeleton,
});
```

[`Outlet`]: /solid/outlet
