# withLayout

Group routes by layout, so you don't need to pass the `layout` property manually
Views returned by one call share a private group identity; switching between
them replaces only the page child and keeps the layout instance mounted.
in every route. Works for [`createRouteView`] and [`createLazyRouteView`].

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
