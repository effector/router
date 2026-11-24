# useLink

Imperative navigation helper. Resolves a registered route to its URL builder,
its bound `onOpen` event and the reactive state of a link to it. Works only
inside `<RouterProvider>`.

## API

```ts
function useLink<T extends object | void = void>(
  to: MaybeRefOrGetter<Route<T>>,
  params?: MaybeRefOrGetter<T | undefined>,
  query?: MaybeRefOrGetter<QueryInput | undefined>,
): UseLinkReturn<T>;

interface UseLinkReturn<T extends object | void = void> {
  build: (params?: T, query?: QueryInput) => string;
  onOpen: (payload: RouteOpenPayload<T>) => RouteOpenPayload<T>;
  href: Readonly<Ref<string>>;
  isActive: Readonly<Ref<boolean>>;
  isExactActive: Readonly<Ref<boolean>>;
  navigate: (event?: MouseEvent) => void;
}
```

`UseLinkReturn` is exported from the package.

`to`, `params` and `query` accept a value, a ref or a getter. The order of the
arguments is the same as in the React and Solid bindings. `useLink(route)` works
as in 0.1.0.

### `build` and `onOpen`

`build(params, query)` builds the route path and appends the serialized query.
`onOpen` is the route's `open` event bound to the current scope. It returns its
payload, as an Effector event does. Both take their own arguments and ignore
`params` and `query` passed to `useLink`.

### `href`

The URL built from `params` and `query` passed to `useLink`. An omitted `query`
keeps the current query of the router. Every read of `href` throws while a
required param of the route is missing.

### `isActive` and `isExactActive`

`isActive` is `true` when the route is opened and its params contain the params
passed to `useLink`. A param that is omitted or `undefined` is not compared.
The params of the route and of its whole `parent` chain are compared, so a link
to a parent route stays active while a child route is opened.

`isExactActive` is `true` when `isActive` is `true`, the route is the last one
matched by the current path and its params equal the params of the link.

Details of the comparison:

- The query is ignored.
- Values are compared after `decodeURIComponent`. A browser history gives the
  path percent-encoded, so `Jürgen` in the link equals `J%C3%BCrgen` in the URL.
  A malformed sequence is compared as it is.
- A number equals its string form. Arrays are compared item by item.
- A key of `params` that the path of the route and of its parents does not
  have is compared as well, so a link with such a key is not active.
- A route is opened only after its `beforeOpen` effects finish. Until then
  `isActive` is `false`.
- Nesting comes from `parent`, not from the URL: a link to `/users` is not
  active on `/users/42` unless the second route has the first as `parent`.

### `navigate`

Opens the route with `params` and `query` passed to `useLink`. `navigate()`
always opens. `navigate(event)` handles a click the way [`Link`](/vue/link)
does:

- It does nothing when the click is modified, not primary or already prevented.
- When the element of the listener is an anchor, it also does nothing for a
  `download` attribute, a `target` other than `_self` and a cross-origin
  `href`.
- Otherwise it calls `event.preventDefault()` and opens the route.

### Example

```vue
<script setup lang="ts">
import { useLink } from '@effector/router-vue';
import { routes } from '@shared/routing';

const props = defineProps<{ id: string }>();

const { href, isActive, navigate } = useLink(routes.profile, () => ({
  id: props.id,
}));
</script>

<template>
  <a :href="href" :class="{ active: isActive }" @click="navigate">
    Open profile
  </a>
</template>
```

The 0.1.0 form:

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
route was not registered in that router. A route from `group()` or `chainRoute`
is not registered: use [`useIsOpened`](/vue/use-is-opened) for its state.
