# Link

Navigates the user to the provided route on click. Has props similar to an `<a>`
element but instead of `href` uses `to` and `params`.

The rendered `href` includes complete path params and the effective query. An
omitted `query` preserves the current router query; an explicit object replaces
it and `{}` clears it. The same payload passed to `route.open` produces the
same URL.

#### `to`

- `type`: `Route<T>`
- `required`: yes

#### `params`

- `type`: `T`
- `required`: if the route has params: `yes`, otherwise: `no`

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
