# useRouter

Get reactive router state and navigation events inside a Vue component. Works
only inside `<RouterProvider>`.

## Return value

`useRouter()` binds the router's Effector unit shape with `useUnit` and returns:

| Property       | Vue value                | Description                     |
| -------------- | ------------------------ | ------------------------------- |
| `path`         | `Readonly<Ref<string>>`  | Current path                    |
| `query`        | `Readonly<Ref<Query>>`   | Current query                   |
| `activeRoutes` | `Readonly<Ref<Route[]>>` | Currently active routes         |
| `onBack`       | `() => void`             | Navigate back                   |
| `onForward`    | `() => void`             | Navigate forward                |
| `onNavigate`   | `(payload) => void`      | Navigate to a path/query target |

Stores become readonly Vue refs. Read them with `.value` in script code; Vue
automatically unwraps them in templates. Events become callable functions.

### Example

```vue
<script setup lang="ts">
import { useRouter } from '@effector/router-vue';

const { path, query, activeRoutes, onBack, onForward, onNavigate } =
  useRouter();

function openSearch() {
  onNavigate({ path: '/search', query: { q: 'router' } });
}

console.log(path.value, query.value, activeRoutes.value);
</script>

<template>
  <nav>
    <button @click="onBack">Back</button>
    <button @click="onForward">Forward</button>
    <button @click="openSearch">Search</button>
    <span>{{ path }} ({{ activeRoutes.length }} active routes)</span>
  </nav>
</template>
```

Use `useRouterContext()` if you need the raw router instance, including its
stores and methods that are not part of the unit shape:

```ts
const router = useRouterContext();
router.setHistory(adapter);
```

Both functions throw
`[useRouter] Router not found. Add RouterProvider in app root` outside
`<RouterProvider>`.
