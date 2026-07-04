# createRoutesView

Creates the routes view — the entry point for all routes. Works only inside
`<RouterProvider>`.

::: warning
**Be careful**: if several routes are active at once, the view will display the
last one listed in the `routes` array.
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
