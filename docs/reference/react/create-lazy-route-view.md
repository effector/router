# createLazyRouteView

Creates a lazy-loaded route view with code splitting support using React's `lazy` and `Suspense`.

## Import

```ts
import { createLazyRouteView } from '@effector/router-react';
```

## Usage

```tsx
import { createLazyRouteView } from '@effector/router-react';
import { profileRoute } from './routes';

export const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./components/ProfileComponent'),
  loading: () => <div>Loading...</div>,
});
```

The imported component must be exported as default:

```tsx
// components/ProfileComponent.tsx
export default function ProfileComponent() {
  return <div>Profile Page</div>;
}
```

## With Layout

Wrap the lazy-loaded view with a layout:

```tsx
import { MainLayout } from './layouts';

export const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./components/ProfileComponent'),
  layout: MainLayout,
  loading: () => <div>Loading...</div>,
});
```

## Configuration

### `route` (required)

The effector/router Router route instance:

```tsx
import { createRoute } from '@effector/router';

const profileRoute = createRoute({ path: '/profile' });

const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./ProfileComponent'),
});
```

### `view` (required)

Dynamic import function that returns a promise with default export:

```tsx
const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./ProfileComponent'),
});
```

### `loading` (optional)

The single "still working" component of a lazy view. It renders while the route
is pending — `beforeOpen` effects, a [`chainRoute`] preparation — and while the
chunk loads. Defaults to an empty fragment:

```tsx
const ProfileScreen = createLazyRouteView({
  route: profileReady,
  view: () => import('./ProfileComponent'),
  loading: () => (
    <div className="loading">
      <Spinner />
      <p>Loading profile...</p>
    </div>
  ),
});
```

Covering both waits with one component is what keeps the routes view
`otherwise` — usually the not-found screen — from flashing between the two.

### `fallback` (deprecated)

The former chunk-only component. It is an alias of `loading` now: used when
`loading` is absent, and rendering for the pending route as well. Rename it to
`loading`; the type is marked `@deprecated`, so editors point at the
replacement.

### `closed` (optional)

Component rendered while the route is not opened. It behaves exactly as in
[`createRouteView`](/react/create-route-view#with-fallbacks), including the
selection order used by [`createRoutesView`](/react/create-routes-view) and
[`Outlet`](/react/outlet).

### `layout` (optional)

Layout component to wrap the view:

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

const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./ProfileComponent'),
  layout: MainLayout,
});
```

### `children` (optional)

Nested route views:

```tsx
const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./ProfileComponent'),
  children: [
    createRouteView({ route: settingsRoute, view: SettingsComponent }),
  ],
});
```

## `CreateLazyRouteViewProps`

`CreateLazyRouteViewProps<T>` is the public configuration type accepted by `createLazyRouteView`.

```ts
import type { CreateLazyRouteViewProps } from '@effector/router-react';
```

| Property   | Type                                        | Description                                                                                           |
| ---------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `route`    | `Route<T>`                                  | Route that controls whether the lazy view is active. Router targets are not supported for lazy views. |
| `view`     | `() => Promise<{ default: ComponentType }>` | Dynamic importer whose module has a default React component export.                                   |
| `loading`  | `ComponentType`                             | Optional component rendered while the route is pending and while the chunk loads.                     |
| `fallback` | `ComponentType`                             | **Deprecated** — alias of `loading`, used when `loading` is absent.                                   |
| `closed`   | `ComponentType`                             | Optional component rendered while the route is not opened.                                            |
| `layout`   | `ComponentType<{ children: ReactNode }>`    | Optional layout that wraps the lazy view and its fallbacks.                                           |
| `children` | `RouteView[]`                               | Optional direct child views rendered through [`Outlet`].                                              |

## Return Value

Returns a [`RouteView`](/react/create-route-view#routeview) object that renders the lazy-loaded component wrapped in React Suspense.

## Code Splitting

Lazy route views enable automatic code splitting - the component code is only loaded when the route is first opened:

```tsx
// App bundle: ~100KB
// Profile component: ~50KB

// User visits homepage → Only app bundle loads (100KB)
// User navigates to profile → Profile component loads (50KB)
```

The importer starts when the route view renders, not when `route.open()` is
called. React `Suspense` can therefore commit the configured fallback while the
chunk is loading. Route or chained `$isPending` represents model preparation;
chunk loading is observed by the Suspense boundary. `loading` spans both, so the
view keeps one visible state from the first navigation intent until the page is
on screen.

## Preloading

Reuse one importer for rendering and an application-owned preload Effect:

```tsx
import { createEffect, sample } from 'effector';

const importProfile = () => import('./components/ProfileComponent');
const preloadProfileFx = createEffect(importProfile);

export const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: importProfile,
  loading: () => <ProfileSkeleton />,
});

sample({ clock: profileLinkHovered, target: preloadProfileFx });
```

Do not call `route.open()` recursively from `beforeOpen`: it creates another
navigation intent instead of preloading a chunk.

## See Also

- [createRouteView](./create-route-view) - Non-lazy route views
- [createRoutesView](./create-routes-view) - Render active routes
- [withLayout](./with-layout) - Apply layouts to multiple routes

[`chainRoute`]: /core/chain-route
