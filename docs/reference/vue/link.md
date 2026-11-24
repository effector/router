# Link

Navigates the user to the provided route on click. Has props similar to an `<a>`
element but instead of `href` uses `to` and `params`.

The rendered `href` includes complete path params and the effective query. An
omitted `query` preserves the current router query; an explicit object replaces
it and `{}` clears it. The same payload passed to `route.open` produces the
same URL.

Only an ordinary primary-button, same-origin `_self` click is intercepted.
Modified or secondary clicks, downloads, cross-origin URLs, non-`_self` targets,
and a user `preventDefault()` keep native anchor behavior.

`Link` infers `params` from the route in `to`. In TSX and in SFC templates
checked by `vue-tsc`, a missing `params` is a type error for a route with a
required param, and a wrong `params` is a type error for any route. A route
with only optional params, such as `/tags/:tag?`, needs no `params`, and a
route without params takes none. `h(Link, ...)` cannot check `params`, because
`h()` does not infer the type parameter of a component.

`LinkPropsOf<typeof route>` and `LinkProps<Params>` are exported for typed
script usage, and `LinkComponent` is the type of `Link`. Standard anchor
attributes and `onClick` are forwarded to the rendered anchor.

When a wrapper component and its parent both listen to `click`, Vue merges the
listeners. `Link` runs them in order and then checks `preventDefault()`. A
listener that calls `stopImmediatePropagation()` skips the listeners after it,
as on a native element. It does not cancel the navigation.

#### `to`

- `type`: `Route<T>`
- `required`: yes

A new `to` updates `href` and the route opened on click.

#### `params`

- `type`: `T`
- `required`: if the route has a required param: `yes`, otherwise: `no`

#### `activeClass`, `exactActiveClass`

- `type`: `string`
- `required`: no

Classes added to the anchor while the link is active or exactly active. There
are no default class names. `activeClass` compares the params of the link. In
the Solid binding `activeClass` follows only `$isOpened` of the route.

### Active state

`Link` takes its state from [`useLink`](/vue/use-link#isactive-and-isexactactive):

- Active: the route is opened and its params contain the params of the link.
  The params of the route and of its whole `parent` chain are compared, so a
  link to a parent route stays active while a child route is opened.
- Exactly active: the link is active and its route is the last one matched by
  the current path.

An exactly active link gets `aria-current="page"`. An `aria-current` attribute
passed to `Link` wins, and `:aria-current="undefined"` removes it. This
attribute is the only change of the rendered markup against 0.1.0.

### Scoped slot

The default slot receives `{ href, isActive, isExactActive, navigate }`, the
names `RouterLink` of vue-router uses. `navigate` opens the route with `params`,
`query` and `replace` of the link. The type `LinkSlotProps` is exported.

Pass the click event to `navigate`, as `@click="navigate"` does. A call without
the event leaves the click to the anchor of the link, and `route.open` runs
twice.

```vue
<template>
  <Link :to="routes.settings" v-slot="{ isActive }">
    <SettingsIcon :filled="isActive" />
    Settings
  </Link>
</template>
```

### Recipe: a flat route table

The active state follows `parent`. Routes created without `parent` are
siblings, so a link to `/users` is not active on `/users/42`. For a tab that
covers several routes, group them with [`group`](/core/group) and read the
group with [`useIsOpened`](/vue/use-is-opened):

```ts
import { group } from '@effector/router';
import { routes } from '@shared/routing';

export const usersSection = group([routes.users, routes.user]);
```

```vue
<script setup lang="ts">
import { Link, useIsOpened } from '@effector/router-vue';
import { routes, usersSection } from '@shared/routing';

const isUsersOpened = useIsOpened(usersSection);
</script>

<template>
  <Link :to="routes.users" :class="{ active: isUsersOpened }">Users</Link>
</template>
```

### Example

```vue
<script setup lang="ts">
import { Link } from '@effector/router-vue';
import { routes } from '@shared/routing';

defineProps<{ user: User }>();
</script>

<template>
  <Link :to="routes.settings">Settings</Link>

  <Link
    v-for="post in user.posts"
    :key="post.id"
    :to="routes.editPost"
    :params="{ id: post.id }"
  >
    Edit post
  </Link>
</template>
```
