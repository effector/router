# Outlet

Renders the nested child routes of the currently opened route. Place it inside a
view whose `RouteView` was created with `children`.

### Example

```ts
export const RoutesView = createRoutesView({
  routes: [
    createRouteView({
      route: routes.profile,
      view: Profile, // renders <Outlet /> somewhere inside
      children: [createRouteView({ route: routes.settings, view: Settings })],
    }),
  ],
});
```

```vue
<!-- Profile.vue -->
<script setup lang="ts">
import { Outlet } from '@effector/router-vue';
</script>

<template>
  <div>Profile</div>
  <!-- renders Settings when profile is opened and settings is active -->
  <Outlet />
</template>
```

`Outlet` is recursive: every selected child provides its own `children` to the
next outlet, with no depth limit. When no child is active it renders nothing.

### Scoped slot

`Outlet` accepts the same default scoped slot as
[`RoutesView`](/vue/create-routes-view#scoped-slot): `Component` is the vnode
of the selected child view and `view` is its `RouteView`. Both are `null` when
no child is active. Without a slot `Outlet` renders the child itself.

```vue
<template>
  <Outlet v-slot="{ Component }">
    <KeepAlive>
      <component :is="Component" />
    </KeepAlive>
  </Outlet>
</template>
```
