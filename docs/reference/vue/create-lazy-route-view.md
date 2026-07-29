# createLazyRouteView

Creates a lazy route view. Accepts `route` (effector/router route), `view` (a
dynamic `import()` of the component), optional `loading` (rendered while the
route is pending and while the bundle loads) and optional `layout`.

## TypeScript

`CreateLazyRouteViewProps<T>` is the exported input type and `RouteView` is the
returned view descriptor. It has the same `route`, optional `layout`,
`otherwise`, `loading`, and optional `children` fields as
`CreateRouteViewProps<T>`, plus:

- `view` — a function returning `Promise<{ default: Component }>`
- `fallback?` — **deprecated** alias of `loading`, used when `loading` is absent

### Example

```ts
import { createLazyRouteView } from '@effector/router-vue';
import { routes } from '@shared/routing';
import { MainLayout } from '@layouts';
import Skeleton from './Skeleton.vue';

export const ProfileScreen = createLazyRouteView({
  route: routes.profile,
  view: () => import('./Profile.vue'),
  loading: Skeleton,
  layout: MainLayout,
});
```

The importer starts when Vue renders the async component. Route opening does
not wait for the chunk, and `loading` is configured as the immediate loading
component. Route/chained `$isPending` describes model preparation rather than
the framework chunk request.

`loading` spans both waits — the pending route (see
[route view fallbacks](/vue/create-route-view#fallbacks)) and the chunk — so the
routes view `otherwise`, usually the not-found screen, no longer flashes between
them:

```ts
export const ProfileScreen = createLazyRouteView({
  route: profileReady,
  view: () => import('./Profile.vue'),
  loading: ProfileSkeleton,
});
```

`fallback` is deprecated: it is an alias of `loading` now, used when `loading` is
absent, and the type is marked `@deprecated` so editors point at the
replacement.

For preload, reuse the importer in an ordinary Effect instead of calling
`route.open()` from a preparation hook:

```ts
import { createEffect } from 'effector';

const importProfile = () => import('./Profile.vue');
const preloadProfileFx = createEffect(importProfile);

export const ProfileScreen = createLazyRouteView({
  route: routes.profile,
  view: importProfile,
  loading: Skeleton,
});
```
