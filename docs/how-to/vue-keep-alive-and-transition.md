---
title: KeepAlive and Transition in Vue
---

# KeepAlive and Transition in Vue

[`RoutesView`](/vue/create-routes-view#scoped-slot), [`Outlet`](/vue/outlet) and
[`LayoutOutlet`](/vue/layout-outlet) hand the current view to a default scoped
slot as `{ Component, view }`. Render it with `<component :is="Component" />`
and wrap it in the built-in components of Vue.

## Keep pages alive

```vue
<script setup lang="ts">
import { RoutesView } from './routes-view';
</script>

<template>
  <RoutesView v-slot="{ Component }">
    <KeepAlive :include="['FeedPage', 'SearchPage']" :max="5">
      <component :is="Component" />
    </KeepAlive>
  </RoutesView>
</template>
```

`include` and `exclude` match the name of a view:

| View                                               | Name                                                                    |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| `createRouteView({ view })`                        | name of the component; an SFC with `<script setup>` takes the file name |
| `createRouteView({ view, name })`                  | `name`                                                                  |
| `createLazyRouteView({ view, name })`              | `name`, known before the chunk loads                                    |
| `createLazyRouteView({ view })`                    | `LazyRouteView`                                                         |
| a view with the `layout` option and without `name` | `RouteViewWithLayout` or `LazyRouteViewWithLayout`                      |
| a view of a `withLayout` group                     | name of the layout component                                            |

For a view of a [`withLayout`](/vue/with-layout) group `Component` is the layout
with the page inside, so one cache entry holds the layout and its current page.

A view of a component without a name is named `RouteView`. Pass `name` to
`createRouteView` to match it.

The page of a lazy view is mounted after its chunk loads, below a component
that is already kept alive. Vue does not call `onActivated` for it on this
first mount, and calls it on every later activation. Use `onMounted` together
with `onActivated`, or call `preload()` before the view opens.

## Keep the pages of a layout alive

Inside a layout of `withLayout`, [`LayoutOutlet`](/vue/layout-outlet) renders
the page of the group and has the same slot:

```vue
<!-- AppLayout.vue -->
<script setup lang="ts">
import { LayoutOutlet } from '@effector/router-vue';
</script>

<template>
  <AppHeader />
  <LayoutOutlet v-slot="{ Component }">
    <KeepAlive>
      <component :is="Component" />
    </KeepAlive>
  </LayoutOutlet>
</template>
```

This `KeepAlive` keeps pages only while the layout stays mounted. On a
navigation by path between two pages of one group the layout is unmounted and
mounted again: the first route closes before the second opens, and `otherwise`
renders in between. The cache inside the layout is lost with it.

To keep the pages across such a navigation, keep the layout alive as well:

```vue
<template>
  <RoutesView v-slot="{ Component }">
    <KeepAlive include="AppLayout">
      <component :is="Component" />
    </KeepAlive>
  </RoutesView>
</template>
```

With both `KeepAlive` in place a navigation `/a` to `/b` to `/a` keeps the state
of page `a` and creates the layout once.

## Animate a page change

```vue
<template>
  <RoutesView v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" />
    </Transition>
  </RoutesView>
</template>
```

- Use `mode="out-in"` and give `RoutesView` an `otherwise` component. On a
  navigation between two path routes the first route closes before the second
  opens, and `RoutesView` renders `otherwise` in between. With `out-in` the
  next page enters after the previous one has left, and `otherwise` does not
  appear. In the default mode `otherwise` enters and leaves between the two
  pages.
- Without `otherwise` the slot receives `null` in between. `Transition` does
  not wait then, and the next page enters while the previous one is leaving.
- A page needs one root element. `Transition` cannot animate a page with
  several root nodes.

## Animate and keep alive

`Transition` goes outside, `KeepAlive` inside. `otherwise` is needed here as
well:

```vue
<template>
  <RoutesView v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <KeepAlive>
        <component :is="Component" />
      </KeepAlive>
    </Transition>
  </RoutesView>
</template>
```

## Nested views

`Outlet` takes the same slot for the child views of a page. It has no
`otherwise`, so between two child routes the slot receives `null`. Render an
empty element in its place, and `out-in` waits for the previous view to leave:

```vue
<template>
  <h1>Profile</h1>
  <Outlet v-slot="{ Component }">
    <Transition name="fade" mode="out-in">
      <component :is="Component" v-if="Component" />
      <i v-else />
    </Transition>
  </Outlet>
</template>
```

Do not put this pair inside `KeepAlive`: Vue fails to switch the view there.
