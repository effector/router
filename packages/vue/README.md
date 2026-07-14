# ☄️ @effector/router-vue

[![npm](https://img.shields.io/npm/v/@effector/router-vue.svg)](https://www.npmjs.com/package/@effector/router-vue)

> **Draft.** Vue 3 bindings for effector router. API mirrors
> [`@effector/router-react`](https://www.npmjs.com/package/@effector/router-react).

Vue 3 bindings for [`@effector/router`](https://www.npmjs.com/package/@effector/router).
Connect routes to components, render the active route, and navigate with a `<Link>` —
all driven by Effector state. **Only the latest Vue 3 (`^3.5`) is supported.**

## Install

```bash
npm install @effector/router-vue @effector/router effector effector-vue vue
```

## Quick start

```ts
import { createRoute, createRouter } from '@effector/router';
import {
  RouterProvider,
  createRouteView,
  createRoutesView,
  Link,
} from '@effector/router-vue';

import Home from './Home.vue';
import About from './About.vue';

// 1. Routes + router (see @effector/router for history setup)
const home = createRoute({ path: '/' });
const about = createRoute({ path: '/about' });
const router = createRouter({ routes: [home, about] });

// 2. Bind each route to a component
const HomeScreen = createRouteView({ route: home, view: Home });
const AboutScreen = createRouteView({ route: about, view: About });

// 3. Render the active route
export const RoutesView = createRoutesView({
  routes: [HomeScreen, AboutScreen],
});
```

```vue
<!-- App.vue -->
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

Read route params in a view with `effector-vue`:

```vue
<script setup lang="ts">
import { useUnit } from 'effector-vue/composition';
import { userRoute } from './router'; // createRoute({ path: '/user/:id' })

const params = useUnit(userRoute.$params);
</script>

<template>
  <div>User {{ params.id }}</div>
</template>
```

Navigate with `<Link>`:

```vue
<script setup lang="ts">
import { Link } from '@effector/router-vue';
import { routes } from '@shared/routing';
</script>

<template>
  <Link :to="routes.settings">Settings</Link>
  <Link :to="routes.editPost" :params="{ id: post.id }">Edit post</Link>
</template>
```

## API

- `RouterProvider` — provide the router to the tree (via `provide`/`inject`).
- `createRouteView` / `createLazyRouteView` — bind a route to a component (with optional lazy loading).
- `createRoutesView` — render the currently opened route, with an `otherwise` fallback.
- `Link`, `useLink` — declarative and imperative navigation.
- `withLayout` — share a layout across routes.
- `Outlet`, `useRouter`, `useIsOpened`, `useOpenedViews` — composition helpers.
- `RouterInjectionKey` — the raw Vue injection key, for advanced `provide` use.

## Scope

Reactivity and Effector `Scope` handling are provided by `effector-vue`. Install
its scope plugin in your app (or tests) to run inside a forked scope:

```ts
import { EffectorScopePlugin } from 'effector-vue';

app.use(EffectorScopePlugin({ scope }));
```

## Documentation

Full guides and API reference: **[router.effector.dev/vue](https://router.effector.dev/vue)**

## License

[MIT](https://github.com/effector/router/blob/main/LICENSE)
