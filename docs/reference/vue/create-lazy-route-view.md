# createLazyRouteView

Creates a lazy route view. Accepts `route` (effector/router route), `view` (a
dynamic `import()` of the component), optional `fallback` (rendered while the
bundle loads) and optional `layout`.

## TypeScript

`CreateLazyRouteViewProps<T>` is the exported input type and `RouteView` is the
returned view descriptor. It has the same `route`, optional `layout`,
`otherwise`, `loading`, and optional `children` fields as
`CreateRouteViewProps<T>`, plus:

- `view` — a function returning `Promise<{ default: Component }>`
- `fallback?` — the component rendered while the async component loads

### Example

```ts
import { createLazyRouteView } from '@effector/router-vue';
import { routes } from '@shared/routing';
import { MainLayout } from '@layouts';
import Fallback from './Fallback.vue';

export const ProfileScreen = createLazyRouteView({
  route: routes.profile,
  view: () => import('./Profile.vue'),
  fallback: Fallback,
  layout: MainLayout,
});
```

The importer starts when Vue renders the async component. Route opening does
not wait for the chunk, and `fallback` is configured as the immediate loading
component. Route/chained `$isPending` describes model preparation rather than
the framework chunk request.

`loading` spans both waits: it is the fallback of a pending route (see
[route view fallbacks](/vue/create-route-view#fallbacks)) and, when `fallback`
is omitted, the async loading component as well.

```ts
export const ProfileScreen = createLazyRouteView({
  route: profileReady,
  view: () => import('./Profile.vue'),
  loading: ProfileSkeleton,
});
```

For preload, reuse the importer in an ordinary Effect instead of calling
`route.open()` from a preparation hook:

```ts
import { createEffect } from 'effector';

const importProfile = () => import('./Profile.vue');
const preloadProfileFx = createEffect(importProfile);

export const ProfileScreen = createLazyRouteView({
  route: routes.profile,
  view: importProfile,
  fallback: Fallback,
});
```
