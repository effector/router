# withLayout

Group routes by layout, so you don't need to pass the `layout` property manually
in every route. Works for [`createRouteView`] and [`createLazyRouteView`].

Views returned by one call share a private group identity; switching between
them replaces only the page child and keeps the layout instance mounted. This
also holds for a group passed as `children` and rendered by `<Outlet />`.

The layout stays only while a view of the group is opened. A navigation between
two path routes closes the first route before it opens the second. No view of
the group is opened in between, so the layout mounts again.

The layout receives the page in its default slot. An `<Outlet />` placed in the
layout itself renders nothing: the children of a page belong to the page.

### Example

```ts
import {
  createRoutesView,
  createRouteView,
  withLayout,
} from '@effector/router-vue';

import { routes } from '@shared/routing';
import { AuthLayout } from '@layouts/auth';

import SignIn from './SignIn.vue';
import SignUp from './SignUp.vue';
import Profile from './Profile.vue';

export const RoutesView = createRoutesView({
  routes: [
    ...withLayout(AuthLayout, [
      createRouteView({ route: routes.signIn, view: SignIn }),
      createRouteView({ route: routes.signUp, view: SignUp }),
    ]),
    createRouteView({ route: routes.profile, view: Profile }),
  ],
});
```

[`createLazyRouteView`]: /vue/create-lazy-route-view
[`createRouteView`]: /vue/create-route-view
