# createRouteView

Creates a route view. Accepts parameters `route` (effector/router route), `view`
(component rendered when the route is opened) and optional `layout`.

## TypeScript

`CreateRouteViewProps<T>` is the exported input type and `RouteView` is the
returned view descriptor. Its properties are:

- `route`: a `Route<T>`, nested `Router`, or route-like target with `$isOpened`
- `view`: the component to render
- `layout?`: an optional component that wraps `view`
- `children?`: nested `RouteView` descriptors for [`Outlet`]
- `name?`: the component name of the view, for `KeepAlive include` and
  devtools. Use it when `view` has no name of its own or is an async component.
  With `name` the view renders through a wrapper component that has this name.

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
