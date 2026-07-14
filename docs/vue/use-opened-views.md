# useOpenedViews

Low-level composable that reactively resolves which of the passed views should be
rendered for the current router state. Returns a `ComputedRef<RouteView[]>`.
Nested (parent) routes are filtered out in favor of their children.

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
