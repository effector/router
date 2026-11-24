# useIsOpened

Reactive flag telling whether the given route (or router) is currently opened.
Returns a `ComputedRef<boolean>`.

```ts
function useIsOpened(
  route: MaybeRefOrGetter<Pick<Route<any>, '$isOpened'> | Router>,
): ComputedRef<boolean>;
```

The route accepts a value, a ref or a getter. When a ref or a getter gives
another route, the flag follows that route.

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

With a getter:

```vue
<script setup lang="ts">
import type { Route } from '@effector/router';
import { useIsOpened } from '@effector/router-vue';

const props = defineProps<{ route: Route<any> }>();

const isOpened = useIsOpened(() => props.route);
</script>
```
