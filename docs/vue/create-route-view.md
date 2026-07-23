# createRouteView

Creates a route view. Accepts parameters `route` (effector/router route), `view`
(component rendered when the route is opened) and optional `layout`.

### Example

```ts
import { createRouteView } from '@effector/router-vue';
import { routes } from '@shared/routing';
import { MainLayout } from '@layouts';
import Profile from './Profile.vue';

export const ProfileScreen = createRouteView({
  route: routes.profile,
  view: Profile,
  layout: MainLayout,
});
```
