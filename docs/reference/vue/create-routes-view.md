# createRoutesView

Creates the routes view — the entry point for all routes. Works only inside
`<RouterProvider>`. Its `routes` option accepts `RouteView[]` descriptors
returned by `createRouteView` or `createLazyRouteView`.

The binding matrix covers path and virtual routes, parent/child suppression,
nested `Router` targets, declarative sibling priority, persistent layouts, and
lazy views with the same recursive `children` contract.

::: warning
When several routes are active, selection happens in two stages:

1. An active child route removes its active parent from the candidates,
   regardless of their order in `routes`.
2. If several candidates remain, the view displays the last one listed in the
   `routes` array.
   :::

Every view renders through its own host component, named after the view
component. A switch between two views always remounts the page, also when both
views use one component. A view passed as a bare `defineAsyncComponent` result
gets the host name `AsyncComponentWrapper`.

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

### Scoped slot

`RoutesView` accepts a default scoped slot. Without a slot it renders the view
itself, as before.

| Slot prop   | Type                | Value                                                              |
| ----------- | ------------------- | ------------------------------------------------------------------ |
| `Component` | `VNode \| null`     | Vnode of the current view, for `<component :is="Component" />`.    |
| `view`      | `RouteView \| null` | The current view. `null` for `otherwise` and when nothing is open. |

`Component` for a view of a [`withLayout`](/vue/with-layout) group is the
layout with the page inside. With no opened view it is the `otherwise` vnode,
or `null` when there is no `otherwise`. The type `RouteViewSlotProps` is
exported.

```vue
<template>
  <RoutesView v-slot="{ Component }">
    <KeepAlive include="FeedPage">
      <component :is="Component" />
    </KeepAlive>
  </RoutesView>
</template>
```

`KeepAlive include` matches a view by the name of its component, or by `name`
passed to `createRouteView` or `createLazyRouteView`. A view of a `withLayout`
group is matched by the name of the layout component: the cached entry is the
layout together with its page.

A slot with one root node receives the attributes passed to `RoutesView`.

On a navigation between two path routes the first route closes before the
second opens. In between the slot receives `otherwise` or `null`.

In 0.1.0 slot content passed to `RoutesView` was ignored. Now it replaces the
view.
