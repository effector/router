# useLink

Imperative navigation helper. Resolves a route to its `href` builder and the
bound `onOpen` event. Works only inside `<RouterProvider>`.

### Example

```vue
<script setup lang="ts">
import { useLink } from '@effector/router-vue';
import { routes } from '@shared/routing';

const { build, onOpen } = useLink(routes.profile);

const href = build({ id: '1' });

function goToProfile() {
  onOpen({ params: { id: '1' } });
}
</script>
```
