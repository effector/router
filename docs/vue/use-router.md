# useRouter

Get reactive router state inside a Vue component. Works only inside
`<RouterProvider>`.

### Example

```vue
<script setup lang="ts">
import { useRouter } from '@effector/router-vue';

const { path, query } = useRouter();
// ... do something with path & query ...
</script>

<template>
  <div>{{ path }}</div>
</template>
```

Use `useRouterContext()` if you need the raw (non-reactive) router instance.
