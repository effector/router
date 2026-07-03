# ☄️ @effector/router

[![npm](https://img.shields.io/npm/v/@effector/router.svg)](https://www.npmjs.com/package/@effector/router)

Flexible, type-safe routing for apps — powered by [Effector](https://effector.dev). Framework-agnostic core: define
routes, drive navigation through events, and read state from stores. Bindings for [React](https://www.npmjs.com/package/@effector/router-react)
and [React Native](https://www.npmjs.com/package/@effector/router-react-native) build on top of it.

## Install

```bash
npm install @effector/router effector history
```

## Quick start

```ts
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { createBrowserHistory } from 'history';

// 1. Define routes (params are inferred from the path)
const home = createRoute({ path: '/' });
const profile = createRoute({ path: '/user/:id' });

// 2. Create a router
const router = createRouter({ routes: [home, profile] });

// 3. Connect it to a history source
router.setHistory(historyAdapter(createBrowserHistory()));

// 4. Navigate through events
home.open();
profile.open({ params: { id: '123' } }); // → /user/123

// 5. React to state through stores
profile.$isOpened.watch((open) => console.log('profile open:', open));
profile.$params.watch((p) => console.log('id:', p.id));
```

## What you get

- **Type-safe params** — `createRoute({ path: '/user/:id' })` infers `Route<{ id: string }>`.
- **Routes as units** — each route exposes `$isOpened`, `$params`, `$isPending` stores and `open`/`opened`/`closed` events.
- **Path & pathless routes** — `createRoute()` and `createVirtualRoute()` for modals, dialogs, and nested flows.
- **Composable navigation** — `chainRoute` for guards/redirects, `group` for related routes, `trackQuery` for query params.

## Core API

| Export                           | Purpose                                        |
| -------------------------------- | ---------------------------------------------- |
| `createRoute`                    | Route with a path and typed params.            |
| `createVirtualRoute`             | Route without a path (modals, tabs, steps).    |
| `createRouter`                   | Combine routes and bind them to history.       |
| `createRouterControls`           | Build router controls separately.              |
| `chainRoute`                     | Conditional navigation / guards / redirects.   |
| `group`                          | Group related routes.                          |
| `trackQuery`                     | Track and react to query parameters.           |
| `historyAdapter`, `queryAdapter` | Connect the router to a history source.        |

## Documentation

Full guides and API reference: **[router.effector.dev/core](https://router.effector.dev/core)**

## License

[MIT](https://github.com/effector/router/blob/main/LICENSE)
