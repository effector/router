# createRouter

Creates a router instance that manages navigation state and routes.

## Basic Usage

```ts
import { createRouter } from '@effector/router';
import { homeRoute, profileRoute } from './routes';

const router = createRouter({
  routes: [homeRoute, profileRoute],
});
```

::: warning
Router must be initialized with `setHistory` event using history from the `history` package:

```ts
import { createBrowserHistory } from 'history';
import { historyAdapter } from '@effector/router';

const history = createBrowserHistory();
router.setHistory(historyAdapter(history));
```

Before initialization, `router.navigate`, `router.back`, and `router.forward`
emit `router.navigationFailed` with `reason: 'not-initialized'` instead of
throwing or starting a navigation attempt.

`router.initialized` fires after every successful `setHistory`, including
reinitialization. `router.updated` fires only for later path/query changes;
equal snapshots and hash-only changes are suppressed.

The router calculates one match result for each normalized location. The same
result drives route activation, `$activeRoutes`, stale-route closing, and
dynamic `registerRoute` matches.

For React apps with Effector scope:

```ts
import { createRoot } from 'react-dom/client';
import { allSettled, fork } from 'effector';
import { createBrowserHistory } from 'history';
import { Provider } from 'effector-react';
import { historyAdapter } from '@effector/router';

const root = createRoot(document.getElementById('root')!);

async function render() {
  const scope = fork();
  const history = createBrowserHistory();

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(history),
  });

  root.render(
    <Provider value={scope}>
      <App />
    </Provider>
  );
}

render();
```

:::

## Configuration

### `routes` (required)

Array of routes to register. Can include:

- **Path routes** - routes with paths
- **Pathless routes** - routes without paths (must assign path here)
- **Nested routers** - other router instances

```ts
const dialogRoute = createRoute(); // Pathless route

const router = createRouter({
  routes: [
    homeRoute, // Path route
    profileRoute, // Path route
    { path: '/dialog', route: dialogRoute }, // Pathless route with assigned path
    nestedRouter, // Nested router
  ],
});
```

### `notFound` (optional)

Pass a pathless route to handle a location for which this router has no
matching route. The fallback is opened with the current query, appears as the
only entry in `$activeRoutes`, and is closed automatically when a known route
matches again. If `notFound` is omitted, an unknown location leaves all routes
closed and does not activate a special route.

```ts
const notFound = createRoute();

const router = createRouter({
  routes: [homeRoute, profileRoute],
  notFound,
});
```

For nested routers, matching is resolved from the deepest configured router
outward. A nested `notFound` handles an unknown remainder inside its base and
prevents an ancestor fallback from opening. If the nested router has no
fallback, the missing location propagates to the nearest ancestor that does.
Local and ancestor fallbacks are never open together.

The not-found contract is stable across root and nested routers: a router with
no fallback leaves an unknown location inactive, query-only changes keep the
selected fallback open, and registering a route takes effect on the next
location update. These behaviors are also isolated by Effector Fork scopes.

### `base` (optional)

Base path prefix for all routes in this router:

```ts
const apiRouter = createRouter({
  base: '/api',
  routes: [usersRoute, postsRoute], // Will be /api/users, /api/posts
});
```

### `controls` (optional)

Custom router controls instance (for advanced use cases):

```ts
import { createRouterControls } from '@effector/router';

const controls = createRouterControls();

const router = createRouter({
  routes: [homeRoute],
  controls, // Use custom controls
});
```

## Navigation

### Direct Navigation

Use `navigate` event to navigate programmatically:

```ts
import { sample } from 'effector';

// Navigate to path
sample({
  clock: goToPage,
  fn: () => ({ path: '/page' }),
  target: router.navigate,
});

// Update query parameters
sample({
  clock: addQuery,
  fn: () => ({ query: { param1: 'hello', params2: [1, 2] } }),
  target: router.navigate,
});

// Navigate with replace
sample({
  clock: replacePage,
  fn: () => ({ path: '/new-page', replace: true }),
  target: router.navigate,
});
```

### Route-based Navigation

Open routes directly (recommended):

```ts
homeRoute.open();
profileRoute.open({ params: { id: '123' } });
profileRoute.open({ query: { tab: 'posts' }, replace: true });
```

## Reading State

### Current Path

```ts
router.$path.watch((path) => {
  console.log('Current path:', path);
});

// Or with map
const isHomePage = router.$path.map((path) => path === '/home');
```

### Query Parameters

```ts
router.$query.watch((query) => {
  console.log('Query params:', query);
});

// Extract specific param
const searchQuery = router.$query.map((query) => query.search);
```

### Active Routes

```ts
router.$activeRoutes.watch((routes) => {
  console.log('Currently active routes:', routes);
});
```

## History Navigation

```ts
// Go back
router.back();

// Go forward
router.forward();
```

## Dynamic Route Registration

Register routes after router creation:

```ts
const router = createRouter({
  routes: [homeRoute],
});

// Later...
router.registerRoute(newRoute);
router.registerRoute({ path: '/modal', route: modalRoute });
```

## Nested Routers

Routers can be nested to create modular route structures:

```ts
const adminRouter = createRouter({
  base: '/admin',
  routes: [dashboardRoute, usersRoute, settingsRoute],
});

const mainRouter = createRouter({
  routes: [
    homeRoute,
    aboutRoute,
    adminRouter, // Nested router
  ],
});
```

## API Reference

| Name            | Type                             | Description                            |
| --------------- | -------------------------------- | -------------------------------------- |
| `$query`        | `Store<Query>`                   | Current query parameters               |
| `$path`         | `Store<string>`                  | Current path                           |
| `$history`      | `Store<RouterAdapter \| null>`   | Current history adapter                |
| `$activeRoutes` | `Store<Route<any>[]>`            | Currently active routes                |
| `back`          | `EventCallable<void>`            | Navigate back (if possible)            |
| `forward`       | `EventCallable<void>`            | Navigate forward (if possible)         |
| `navigate`      | `EventCallable<NavigatePayload>` | Navigate to path with query            |
| `setHistory`    | `EventCallable<RouterAdapter>`   | Initialize router with history adapter |
| `registerRoute` | `(route: InputRoute) => void`    | Dynamically register a route           |
| `ownRoutes`     | `MappedRoute[]`                  | Routes owned by this router            |
| `knownRoutes`   | `MappedRoute[]`                  | All known routes (including nested)    |

## Shared controls configuration

`controls` may be created with routes in a lower FSD layer. `createRouter`
registers route matchers on that instance; the app then attaches history:

```ts
const router = createRouter({ routes: Object.values(routes), controls });
controls.setHistory(historyAdapter(createBrowserHistory()));
```

This lets features use `beforeNavigate({ controls, ... })` without depending on
the application router. Routes in `from`/`to` must be registered on a router
using the same controls.

Query tracking is also composed from the same controls:

```ts
const tracker = trackQuery({
  controls,
  routes: Object.values(routes),
  parameters,
});
```

## Types

### NavigatePayload

```ts
type NavigatePayload = {
  path?: string; // Path to navigate to
  query?: Query; // Query parameters
  replace?: boolean; // Replace instead of push
};
```

### Query

```ts
type QueryValue = string | null | Array<string | null>;
type Query = Record<string, QueryValue>;
type QueryInput = Record<string, QueryValue | undefined>;
```

The core codec parses repeated keys into ordered arrays, serializes `null` as a
flag, and omits `undefined` keys. `$query` stores the normalized `Query`; input
payloads may use `QueryInput` when a key must be removed.

### InputRoute

```ts
type InputRoute =
  | PathRoute<any> // Route with path
  | { path: string; route: PathlessRoute<any> } // Pathless route with assigned path
  | Router; // Nested router
```

[`trackQuery`]: /core/track-query
