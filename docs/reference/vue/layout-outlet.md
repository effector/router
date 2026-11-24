# LayoutOutlet

Renders the page of a [`withLayout`] group. Place it in the layout of the group
in place of the default slot. [`Outlet`] keeps its meaning: it renders the
children of a view.

The default slot of a layout works as before. A layout that uses both
`<slot />` and `<LayoutOutlet />` renders the page twice.

### Scoped slot

`LayoutOutlet` accepts the same default scoped slot as
[`RoutesView`](/vue/create-routes-view#scoped-slot). `Component` is the vnode
of the page without the layout, and `view` is its `RouteView`. With the slot a
layout can wrap its page in `KeepAlive` or `Transition`.

```vue
<!-- AuthLayout.vue -->
<script setup lang="ts">
import { LayoutOutlet } from '@effector/router-vue';
</script>

<template>
  <header>Auth</header>
  <LayoutOutlet v-slot="{ Component }">
    <KeepAlive>
      <component :is="Component" />
    </KeepAlive>
  </LayoutOutlet>
</template>
```

```ts
export const RoutesView = createRoutesView({
  routes: withLayout(AuthLayout, [
    createRouteView({ route: routes.signIn, view: SignIn }),
    createRouteView({ route: routes.signUp, view: SignUp }),
  ]),
});
```

### When the layout remounts

`KeepAlive` inside a layout keeps pages only while the layout stays mounted.

On a navigation by path between two pages of one group the layout is unmounted
and mounted again. The first route closes before the second opens, and
`otherwise` renders in between. The order for `/a` to `/b`:

1. page `a` is unmounted
2. the layout is unmounted
3. `otherwise` is mounted
4. `otherwise` is unmounted
5. page `b` is mounted
6. the layout is mounted

The pages cached inside the layout are lost with it.

To keep them, keep the layout alive as well: wrap the view of `RoutesView` in
`KeepAlive` through its scoped slot. The entry of a group is cached under the
name of the layout component.

```vue
<template>
  <RoutesView v-slot="{ Component }">
    <KeepAlive include="AuthLayout">
      <component :is="Component" />
    </KeepAlive>
  </RoutesView>
</template>
```

With both in place a navigation `/a` to `/b` to `/a` keeps the state of page
`a` and creates the layout once.

### Outside a group

`LayoutOutlet` works only in a layout passed to `withLayout`. In a layout passed
through the `layout` option of [`createRouteView`] or [`createLazyRouteView`],
and inside a page, it renders nothing and reports that through `console.error`.

[`createLazyRouteView`]: /vue/create-lazy-route-view
[`createRouteView`]: /vue/create-route-view
[`Outlet`]: /vue/outlet
[`withLayout`]: /vue/with-layout
