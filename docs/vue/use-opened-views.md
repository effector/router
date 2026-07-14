# useOpenedViews

Low-level composable that reactively resolves which of the passed views should be
rendered for the current router state. Returns a `ComputedRef<RouteView[]>`.

The returned array preserves declaration order and applies route priority in two
stages:

1. From the active views, an active parent is removed when its child is also
   active. The child wins regardless of declaration order.
2. All remaining active views stay in the array in their original order.
   `createRoutesView` and `Outlet` render the last one, so declaration order is
   the tie-breaker only after parent filtering.

`createRoutesView` and `Outlet` are built on top of it; use it directly only for
custom rendering.

### Example

```vue
<script setup lang="ts">
import { useOpenedViews } from '@effector/router-vue';
import { FeedScreen, ProfileScreen } from './screens';

const openedViews = useOpenedViews([FeedScreen, ProfileScreen]);
</script>
```
