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
