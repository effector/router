# createRoutesView

Creates the routes view — the entry point for all routes. Works only inside
`<RouterProvider>`.

::: warning
When several routes are active, selection happens in two stages:

1. An active child route removes its active parent from the candidates,
   regardless of their order in `routes`.
2. If several candidates remain, the view displays the last one listed in the
   `routes` array.
   :::

### Example

```ts
import { createRoutesView } from '@effector/router-vue';
// feed screen & profile screen must be created with createRouteView!
import { FeedScreen, ProfileScreen } from './screens';

export const RoutesView = createRoutesView({
  routes: [FeedScreen, ProfileScreen],
  otherwise: NotFound, // optional fallback component
});
```

```vue
<template>
  <RouterProvider :router="router">
    <RoutesView />
  </RouterProvider>
</template>
```
