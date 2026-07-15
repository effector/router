# ☄️ @effector/router

[![npm](https://img.shields.io/npm/v/@effector/router.svg)](https://www.npmjs.com/package/@effector/router)

Flexible, type-safe routing for apps — powered by [Effector](https://effector.dev). Framework-agnostic core: define
routes, drive navigation through events, and read state from stores. Bindings for [React](https://www.npmjs.com/package/@effector/router-react),
[React Native](https://www.npmjs.com/package/@effector/router-react-native) and [Vue](https://www.npmjs.com/package/@effector/router-vue) build on top of it.

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
- **Routes as units** — path and virtual routes share `$isOpened`, `$params`,
  `$isPending`, `open`, `close`, `opened`, `updated`, and `closed` units.
- **Path & pathless routes** — `createRoute()` and `createVirtualRoute()` for modals, dialogs, and nested flows.
- **Composable navigation** — `beforeNavigate` and `redirect` for pre-commit policy, `chainRoute` for post-commit readiness.

Routes without required params accept `open()`, `open({})`, and
`open({ params: {} })` interchangeably. Parameterized opens use only the
current payload and never merge missing values from previous state.

Nested routes expose the complete parent/child params on the child route while
each parent activation stores only the params declared by that route's path.
Duplicate parameter names are rejected by the path validator.

## Core API

| Export                           | Purpose                                      |
| -------------------------------- | -------------------------------------------- |
| `createRoute`                    | Route with a path and typed params.          |
| `createVirtualRoute`             | Route without a path (modals, tabs, steps).  |
| `createRouter`                   | Combine routes and bind them to history.     |
| `createRouterControls`           | Build router controls separately.            |
| `beforeNavigate`                 | Hold or confirm navigation before history.   |
| `redirect`                       | Semantic route redirect target for `sample`. |
| `chainRoute`                     | Derive post-commit route readiness.          |
| `group`                          | Group related routes.                        |
| `trackQuery`                     | Track and react to query parameters.         |
| `historyAdapter`, `queryAdapter` | Connect the router to a history source.      |

`createRoute<Params>()` is the pathless/virtual form. `createVirtualRoute` is
the deprecated compatibility factory; new code should use the shared
`createRoute` lifecycle. A pathless route opens from its own Effector units,
does not need router registration, and never writes history.

## Documentation

Full guides and API reference: **[router.effector.dev/core](https://router.effector.dev/core)**

## License

[MIT](https://github.com/effector/router/blob/main/LICENSE)
