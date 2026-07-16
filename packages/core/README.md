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

An optional pathless `notFound` route handles unknown locations at the router
root. It is opened with the current query, exposed as the only
`router.$activeRoutes` entry, and closed when a registered route matches again:

```ts
const notFound = createRoute();
const router = createRouter({ routes: [home, profile], notFound });
```

Nested routers apply the same rule from the inside out: a nested `notFound`
handles an unknown remainder within its base, while a missing nested fallback
propagates to the nearest ancestor fallback. The two fallbacks are never open
at the same time.

Unknown locations without a configured fallback leave all routes closed.
Query-only updates preserve the active fallback, and a dynamically registered
route is selected on the next location update. The behavior is scope-safe when
the router is used with Effector Fork.

## What you get

- **Type-safe params** — `createRoute({ path: '/user/:id' })` infers `Route<{ id: string }>`.
- **Routes as units** — path and virtual routes share `$isOpened`, `$params`,
  `$isPending`, `open`, `close`, `opened`, `updated`, and `closed` units.
- **Path & pathless routes** — `createRoute({ path })` and `createRoute()` for
  URL routes, modals, dialogs, and nested flows.
- **Composable navigation** — `beforeNavigate` and `redirect` for pre-commit policy, `chainRoute` for post-commit readiness.

Routes without required params accept `open()`, `open({})`, and
`open({ params: {} })` interchangeably. Parameterized opens use only the
current payload and never merge missing values from previous state.

Nested routes expose the complete parent/child params on the child route while
each parent activation stores only the params declared by that route's path.
Duplicate parameter names are rejected by the path validator.

`route.updated` compares parameter values independent of object key order. It
preserves array order and distinguishes `null` from an absent key, skips the
first activation, and does not fire for equal params, query-only changes, or
close operations.

Its payload is named `RouteUpdatedPayload<T>` to distinguish updates from the
initial `RouteOpenedPayload<T>` while preserving the same payload shape.

The compatibility matrix covers pathless routes, the deprecated virtual-route
alias, nested parent chains, server/client lifecycle events, Fork scopes, and
the fact that virtual routes never write to history.

## Core API

| Export                           | Purpose                                          |
| -------------------------------- | ------------------------------------------------ |
| `createRoute`                    | Path or pathless route factory.                  |
| `createRouter`                   | Combine routes and bind them to history.         |
| `createRouterControls`           | Build router controls separately.                |
| `beforeNavigate`                 | Hold or confirm navigation before history.       |
| `redirect`                       | Semantic route redirect target for `sample`.     |
| `chainRoute`                     | Derive post-commit route readiness.              |
| `group`                          | Group related routes.                            |
| `trackQuery`                     | Standalone query tracker composed with controls. |
| `historyAdapter`, `queryAdapter` | Connect the router to a history source.          |

`createRoute<Params>()` is the pathless/virtual form. `createVirtualRoute` is
retained only as a deprecated compatibility factory; new code should use the
shared `createRoute` lifecycle. A pathless route opens from its own Effector units,
does not need router registration, and never writes history.

`chainRoute` also returns the shared pathless route shape (plus its
`cancelled` event), so chained routes do not depend on the legacy virtual-route
factory.

`RouterAdapter.location` is a live `{ pathname, search, hash }` snapshot. It
reflects adapter pushes, replaces, and native history updates instead of the
location object captured during adapter creation.

String and partial object targets resolve omitted pathname, search, and hash
fields from the adapter's current location. This applies to both history and
query adapters.

In keyed query mode, only the configured query key is owned by the nested
router; unrelated keys, host pathname/hash, multiple query adapters, and a
shared `historyAdapter` remain intact. Whole-search mode intentionally owns the
entire search section.

Before initialization, `$path` is `null` and `$query` is `{}`. Each
`setHistory` loads its adapter snapshot and disconnects the previous adapter's
listeners before subscribing to the new one.

Calling `navigate`, `back`, or `forward` before initialization emits one
`navigationFailed` event with `reason: 'not-initialized'`; it does not throw or
create a navigation attempt. The same event is exposed by Router and controls.

Router also exposes `initialized` after every successful `setHistory` and
`updated` after later normalized path/query changes. Equal snapshots and
hash-only changes produce neither an event nor a store update.

Query values use one codec across controls and core navigation: `null` becomes
a flag, arrays become repeated keys in order, `undefined` removes a key, and
key order is ignored for equality. Use `QueryInput` for navigation payloads
that include removals; `$query` always exposes the normalized `Query` value.

Navigation preserves the current query when `query` is omitted, replaces the
whole query when an object is provided, and clears it with `query: {}`. Route
opens and redirects follow the same rules as controls.

Create query trackers with `trackQuery({ controls, routes, parameters })`.
`routes` is optional and uses OR semantics over each route's `$isOpened` store;
without it, the tracker is always active. The tracker reacts automatically—no
`check` clock or router/controls method is required.

`trackQuery.enter` accepts only schema-owned URL values (`string`, `null`, or
arrays); `entered` emits the schema output after parsing and transforms.
`exit` removes only schema-owned keys and preserves unrelated query keys,
including keys listed in `ignoreParams`.
The same contract is covered for flags, repeated keys, empty arrays, encoding,
path-only navigation, explicit clears, and adapter round trips.

The lifecycle matrix also covers string/partial adapter round trips, repeated
initialization, stale-listener cleanup, native POP, Fork isolation, and equal
snapshot suppression.

The accepted lifecycle contract and its compatibility matrix are documented in
the [navigation lifecycle reference](../../docs/core/navigation-lifecycle.md).

Route activation, `$activeRoutes`, stale-route closing, and dynamic route
registration share one internal match result.

## Documentation

Full guides and API reference: **[router.effector.dev/core](https://router.effector.dev/core)**

## License

[MIT](https://github.com/effector/router/blob/main/LICENSE)
