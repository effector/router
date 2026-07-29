# createRouteView

Creates an eager `RouteView` that binds an effector/router route or nested router to a Solid component.

## API

```ts
function createRouteView<T extends object | void = void>(
  props: CreateRouteViewProps<T>,
): RouteView;
```

| Property    | Type                                   | Description                                     |
| ----------- | -------------------------------------- | ----------------------------------------------- |
| `route`     | `Route<T> \| Router`                   | Unit that controls whether the view opens       |
| `view`      | `Component`                            | Component rendered for the opened unit          |
| `layout`    | `Component<{ children: JSX.Element }>` | Optional wrapper component                      |
| `otherwise` | `Component`                            | Optional component rendered while it is closed  |
| `loading`   | `Component`                            | Optional component rendered while it is pending |
| `children`  | `RouteView[]`                          | Optional direct child views for [`Outlet`]      |

## `CreateRouteViewProps`

`CreateRouteViewProps<T>` is the exported public input type for `createRouteView`. Its fields are the properties in the table above; `T` is the route parameter type.

## `RouteView`

`RouteView` is the exported public type returned by `createRouteView` and accepted by `createRoutesView`, `useOpenedViews`, `withLayout`, and the `children` property. A route view contains its route or nested router target, the Solid component to render, and optional child route views. Create these values with `createRouteView` or `createLazyRouteView` rather than constructing layout metadata yourself.

## Usage

```tsx
import { createRouteView } from '@effector/router-solid';

const ProfileScreen = createRouteView({
  route: profileRoute,
  view: () => <h1>Profile</h1>,
  layout: MainLayout,
});
```

Route parameters remain available through Effector units. `useUnit` returns a Solid accessor:

```tsx
import { useUnit } from 'effector-solid';

const UserScreen = createRouteView({
  route: userRoute,
  view: () => {
    const params = useUnit(userRoute.$params);
    return <h1>User {params().id}</h1>;
  },
});
```

Use `children` with [`Outlet`](./outlet) for nested views. A `Router` target is active while its `$activeRoutes` is non-empty.

## Fallbacks

`loading` covers the wait for data — a route with `beforeOpen`, or a
[`chainRoute`] output that stays pending until preparation resolves.
`otherwise` covers the plain closed state.

```tsx
const ProfileScreen = createRouteView({
  route: profileReady,
  view: Profile,
  loading: () => <ProfileSkeleton />,
  otherwise: () => <p>Pick a profile</p>,
});
```

[`createRoutesView`] and [`Outlet`] still render a single view, resolved in this
order:

1. the deepest **opened** view;
2. otherwise the `loading` of a **pending** view;
3. otherwise the `otherwise` of a closed view;
4. otherwise the `otherwise` prop of [`createRoutesView`] (nothing inside an
   [`Outlet`]).

Later declarations win between equal candidates, mirroring how an opened sibling
is selected. An opened view always wins, so `loading` never replaces a page that
is already on screen. Fallbacks are wrapped by the view's `layout` and by its
[`withLayout`] group, so the layout stays mounted while a nested chain resolves:

```tsx
const ProfileScreen = createRouteView({
  route: profileRoute,
  view: Profile, // renders <Outlet />
  children: [
    createRouteView({
      route: settingsReady,
      view: Settings,
      loading: () => <SettingsSkeleton />,
    }),
  ],
});
```

::: tip
A view listed in `createRoutesView` that declares `otherwise` renders that
component for every state in which nothing else is opened, including an
unmatched URL. Keep the not-found screen in the `otherwise` of
`createRoutesView`, and use a per-view `otherwise` where the view owns its
slot — inside an `Outlet`, or in a routes view with a single entry.
:::

[`chainRoute`]: /core/chain-route
[`createRoutesView`]: /solid/create-routes-view
[`Outlet`]: /solid/outlet
[`withLayout`]: /solid/with-layout
