# useIsOpened

Reactive flag telling whether the given route (or router) is currently opened.
Returns a `ComputedRef<boolean>`.

### Example

```vue
<script setup lang="ts">
import { useIsOpened } from '@effector/router-vue';
import { routes } from '@shared/routing';

const isProfileOpened = useIsOpened(routes.profile);
</script>

<template>
  <span v-if="isProfileOpened">Profile is open</span>
</template>
```
