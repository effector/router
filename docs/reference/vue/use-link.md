# useLink

Imperative navigation helper. Resolves a registered route to its URL builder
and bound `onOpen` event. Works only inside `<RouterProvider>`.

## API

```ts
function useLink<T extends object | void = void>(
  to: Route<T>,
): UseLinkReturn<T>;

interface UseLinkReturn<T extends object | void = void> {
  build: (params?: T, query?: QueryInput) => string;
  onOpen: (payload: RouteOpenPayload<T>) => RouteOpenPayload<T>;
}
```

`UseLinkReturn` is exported from the package.

`build(params, query)` builds the route path and appends the serialized query.
`onOpen` is the route's `open` event bound to the current scope. It returns its
payload, as an Effector event does. It does not capture arguments passed to
`build`, so pass the navigation payload when calling it.

### Example

```vue
<script setup lang="ts">
import { useLink } from '@effector/router-vue';
import { routes } from '@shared/routing';

const { build, onOpen } = useLink(routes.profile);

const href = build({ id: '1' }, { tab: 'activity' });

function goToProfile() {
  onOpen({
    params: { id: '1' },
    query: { tab: 'activity' },
  });
}
</script>

<template>
  <a :href="href" @click.prevent="goToProfile">Open profile</a>
</template>
```

`useLink` compares `to` with `router.knownRoutes`. It throws
`[useLink] Route not found. Maybe it is not passed into createRouter?` when the
route was not registered in that router.
