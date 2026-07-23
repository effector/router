# createLazyRouteView

Creates a lazy route view. Accepts `route` (effector/router route), `view` (a
dynamic `import()` of the component), optional `fallback` (rendered while the
bundle loads) and optional `layout`.

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
