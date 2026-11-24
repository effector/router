# createLazyRouteView

Creates a lazy route view. Accepts `route` (effector/router route), `view` (a
dynamic `import()` of the component), optional `fallback` (rendered while the
bundle loads), optional `layout` and the loading options listed below.

## TypeScript

`CreateLazyRouteViewProps<T>` is the exported input type and `RouteView` is the
returned view descriptor. It has the same `route`, optional `layout`, and
optional `children` fields as `CreateRouteViewProps<T>`, plus:

- `view`: a function returning `Promise<{ default: Component }>`
- `fallback?`: the component rendered while the async component loads
- `error?`: the component rendered when the loader rejects or `timeout`
  passes; it receives the error as the `error` prop
- `onError?`: `(error, retry, fail, attempts) => void`, called when the loader
  rejects; `retry()` calls the loader again, `fail()` shows `error`
- `timeout?`: milliseconds before a pending loader counts as failed; no limit
  by default
- `delay?`: milliseconds before `fallback` shows; `0` by default
- `suspensible?`: `false` by default, see [Suspense](#suspense)
- `hydrate?`: a hydration strategy such as `hydrateOnVisible()`

`onError`, `timeout`, `delay`, `suspensible` and `hydrate` go to Vue's
[`defineAsyncComponent`] unchanged, and `error` goes there as `errorComponent`.

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

### Errors

Without `error` a failed loader leaves `fallback` on screen. `onError` can retry:

```ts
export const ProfileScreen = createLazyRouteView({
  route: routes.profile,
  view: () => import('./Profile.vue'),
  fallback: Fallback,
  error: LoadError, // props: { error: Error }
  timeout: 10_000,
  onError: (error, retry, fail, attempts) => (attempts < 3 ? retry() : fail()),
});
```

### Suspense

With the default `suspensible: false` the view shows its own `fallback`, also
under an ancestor `<Suspense>`. With `suspensible: true` an ancestor
`<Suspense>` waits for the loader and shows the Suspense fallback; `fallback`,
`delay` and `timeout` of the view are then ignored. Without an ancestor
`<Suspense>` the option changes nothing.

### Preload

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

[`defineAsyncComponent`]: https://vuejs.org/api/general.html#defineasynccomponent
