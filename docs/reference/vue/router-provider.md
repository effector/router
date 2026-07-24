# RouterProvider

Provides the router to the Vue component tree via `provide`/`inject`. All views,
[`Link`] components, and composables must be rendered inside it.

#### `router`

- `type`: `Router`
- `required`: yes

### Example

```vue
<script setup lang="ts">
import { RouterProvider } from '@effector/router-vue';
import { router } from './router';
import { RoutesView } from './routes';
</script>

<template>
  <RouterProvider :router="router">
    <RoutesView />
  </RouterProvider>
</template>
```

[`Link`]: /vue/link
