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
      children: [
        createRouteView({ route: routes.settings, view: Settings }),
      ],
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
