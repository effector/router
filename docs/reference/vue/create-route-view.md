# createRouteView

Creates a route view. Accepts parameters `route` (effector/router route), `view`
(component rendered when the route is opened) and optional `layout`, `closed`,
and `loading`.

## TypeScript

`CreateRouteViewProps<T>` is the exported input type and `RouteView` is the
returned view descriptor. Its properties are:

- `route` — a `Route<T>`, nested `Router`, or route-like target with `$isOpened`
- `view` — the component to render
- `layout?` — an optional component that wraps `view` and its fallbacks
- `closed?` — an optional component rendered while the route is not opened
- `loading?` — an optional component rendered while the route is pending
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

## Fallbacks

`loading` covers the wait for data — a route with `beforeOpen`, or a
[`chainRoute`] output that stays pending until preparation resolves.
`closed` covers the plain closed state.

```ts
export const ProfileScreen = createRouteView({
  route: profileReady,
  view: Profile,
  loading: ProfileSkeleton,
  closed: ProfilePlaceholder,
});
```

[`createRoutesView`] and [`Outlet`] still render a single view, resolved in this
order:

1. the deepest **opened** view;
2. otherwise the `loading` of a **pending** view;
3. otherwise the view most recently resolved, while any listed route is still
   **pending**;
4. otherwise the `closed` of a closed view;
5. otherwise the `otherwise` prop of [`createRoutesView`] (nothing inside an
   [`Outlet`]).

Later declarations win between equal candidates. An opened view always wins, so
`loading` never replaces a page that is already on screen.

Step 3 is a hold: closing the previous route and opening the next one is not
atomic, so for one instant nothing in the list is opened. Without the hold that
instant would fall through to `closed`/`otherwise` and tear the rendered
branch — a [`withLayout`] group included — down with it, even when neither
view declares a `loading`. The hold applies only while something is pending;
an unmatched URL has nothing pending for it, so `otherwise` still shows without
delay.

Fallbacks are wrapped by the view's `layout` and by its [`withLayout`] group,
so the layout stays mounted while a nested chain resolves:

```ts
export const ProfileScreen = createRouteView({
  route: routes.profile,
  view: Profile, // renders <Outlet />
  children: [
    createRouteView({
      route: settingsReady,
      view: Settings,
      loading: SettingsSkeleton,
    }),
  ],
});
```

::: tip
A view listed in `createRoutesView` that declares `closed` renders that
component for every state in which nothing else is opened, including an
unmatched URL. Keep the not-found screen in the `otherwise` of
`createRoutesView`, and use a per-view `closed` where the view owns its slot —
inside an `Outlet`, or in a routes view with a single entry.
:::

[`chainRoute`]: /core/chain-route
[`createRoutesView`]: /vue/create-routes-view
[`Outlet`]: /vue/outlet
[`withLayout`]: /vue/with-layout
