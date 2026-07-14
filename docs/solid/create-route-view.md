# createRouteView

Creates an eager `RouteView` that binds an effector/router route or nested router to a Solid component.

## API

```ts
function createRouteView<T extends object | void = void>(
  props: CreateRouteViewProps<T>,
): RouteView;
```

| Property   | Type                                   | Description                               |
| ---------- | -------------------------------------- | ----------------------------------------- |
| `route`    | `Route<T> \| Router`                   | Unit that controls whether the view opens |
| `view`     | `Component`                            | Component rendered for the opened unit    |
| `layout`   | `Component<{ children: JSX.Element }>` | Optional wrapper component                |
| `children` | `RouteView[]`                          | Optional direct child views for `Outlet`  |

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
