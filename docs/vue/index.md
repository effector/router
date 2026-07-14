# Vue β

Vue 3 bindings for effector/router, providing components and composables for seamless integration.

::: warning
This package is a **draft (β)**. Only the latest Vue 3 (`^3.5`) is supported.
:::

## Overview

`@effector/router-vue` mirrors the [`@effector/router-react`](/react/) API for Vue 3:

- **Route Views** — connect routes to Vue components
- **Navigation Components** — [`Link`] and navigation helpers
- **Composables** — access router state in components
- **Layouts** — wrap multiple routes with shared layouts

## Installation

```bash
npm install @effector/router-vue @effector/router effector effector-vue vue
```

## Key Concepts

### Route Views

Route Views connect routes to Vue components:

```ts
import { createRouteView } from '@effector/router-vue';
import Home from './Home.vue';

const HomeScreen = createRouteView({ route: homeRoute, view: Home });
```

### Router Provider

Provide the router to your Vue tree:

```vue
<template>
  <RouterProvider :router="router">
    <RoutesView />
  </RouterProvider>
</template>
```

### Scope

Reactivity and Effector `Scope` are handled by `effector-vue`. Register its scope
plugin at the app root when you need a forked scope:

```ts
import { EffectorScopePlugin } from 'effector-vue';

app.use(EffectorScopePlugin({ scope }));
```

[`Link`]: /vue/link
