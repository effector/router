# createRouteView

Creates a route view. Accepts parameters `route` (effector/router route), `view`
(component rendered when the route is opened) and optional `layout`.

## TypeScript

`CreateRouteViewProps<T>` is the exported input type and `RouteView` is the
returned view descriptor. Its properties are:

- `route` — a `Route<T>`, nested `Router`, or route-like target with `$isOpened`
- `view` — the component to render
- `layout?` — an optional component that wraps `view`
- `children?` — nested `RouteView` descriptors for [`Outlet`]

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

[`Outlet`]: /vue/outlet
