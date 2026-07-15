# createRoute

Create a route with or without a path. Routes are the building blocks of navigation in effector/router.

## API

```typescript
// Path route
function createRoute<T extends string>(
  config: CreateRouteConfig<T>,
): PathRoute<ParseUrlParams<T>>;

// Pathless route
function createRoute<Params extends object | void = void>(
  config?: WithBaseRouteConfig,
): PathlessRoute<Params>;
```

### Config

| Parameter    | Type         | Description                                 |
| ------------ | ------------ | ------------------------------------------- |
| `path`       | `string`     | Optional. URL path template with parameters |
| `parent`     | `Route<any>` | Optional. Parent route for nesting          |
| `beforeOpen` | `Effect[]`   | Deprecated post-commit preparation Effects  |

### Returns

Returns either `PathRoute<T>` or `PathlessRoute<T>` depending on whether `path` is provided. Both forms expose the same lifecycle units; `createVirtualRoute` remains a deprecated compatibility factory.

| Property         | Type                                   | Description                                  |
| ---------------- | -------------------------------------- | -------------------------------------------- |
| `$params`        | `Store<T>`                             | Route parameters                             |
| `$isOpened`      | `Store<boolean>`                       | Whether route (or its children) are opened   |
| `$isPending`     | `Store<boolean>`                       | Deprecated route preparation is running      |
| `open`           | `EventCallable<RouteOpenedPayload<T>>` | Open the route and its parents               |
| `opened`         | `Event<RouteOpenedPayload<T>>`         | Fires when route opens (client or server)    |
| `openedOnServer` | `Event<RouteOpenedPayload<T>>`         | Fires when opened on server (SSR)            |
| `openedOnClient` | `Event<RouteOpenedPayload<T>>`         | Fires when opened on client                  |
| `updated`        | `Event<RouteOpenedPayload<T>>`         | Fires when an open route receives new params |
| `close`          | `EventCallable<void>`                  | Closes the route                             |
| `closed`         | `Event<void>`                          | Fires when route closes                      |
| `path`           | `string`                               | _PathRoute only_: The route's path template  |
| `parent`         | `Route<any>`                           | Optional. The parent route                   |
| `beforeOpen`     | `Effect[]`                             | Deprecated post-commit preparation Effects   |

## Usage

### Path Routes

Routes with paths for URL-based navigation:

```ts
import { createRoute } from '@effector/router';

// Basic route
const homeRoute = createRoute({ path: '/' });
homeRoute.open();

// Route with parameters
const userRoute = createRoute({ path: '/user/:id' });
userRoute.open({ params: { id: '123' } });

// Route with query
const searchRoute = createRoute({ path: '/search' });
searchRoute.open({ query: { q: 'hello' } });
```

### Pathless Routes

Routes without paths for dialogs, modals, or other non-URL navigation:

```ts
import { createRoute } from '@effector/router';

// Without parameters
const dialogRoute = createRoute();
dialogRoute.open();

// With typed parameters
const confirmDialog = createRoute<{ title: string; message: string }>();
confirmDialog.open({
  params: { title: 'Delete', message: 'Are you sure?' },
});
```

::: warning Register Pathless Routes
Pathless routes must be assigned a path when registered in the router:

```ts
import { createRouter } from '@effector/router';

const router = createRouter({
  routes: [
    homeRoute, // Has path: '/'
    { path: '/dialog', route: dialogRoute }, // Assign path to pathless route
  ],
});
```

:::

### Path Parameters

Path parameters are automatically parsed and type-checked:

```ts
import { createRoute } from '@effector/router';

// String parameters (default)
const userRoute = createRoute({ path: '/user/:id' });
//    ^- Route<{ id: string }>

userRoute.open({ params: { id: '123' } });
```

#### Typed Parameters

Specify parameter types for validation and type safety:

```ts
// Number parameters
const postRoute = createRoute({ path: '/post/:id<number>' });
//    ^- Route<{ id: number }>

postRoute.open({ params: { id: 42 } });

// Union types
const modeRoute = createRoute({ path: '/edit/:mode<create|update>' });
//    ^- Route<{ mode: 'create' | 'update' }>

modeRoute.open({ params: { mode: 'create' } });

// Multiple parameters
const blogRoute = createRoute({
  path: '/blog/:year<number>/:month<number>/:slug',
});
//    ^- Route<{ year: number; month: number; slug: string }>

blogRoute.open({
  params: { year: 2024, month: 1, slug: 'hello-world' },
});
```

See [@effector/router-paths](https://github.com/effector/router/tree/main/packages/router-paths#supported-types) for all supported parameter types and modifiers.

### Observe Navigation and Applied Parameters

Use `opened` to react after a route opens on either the client or server. At that point `$params` contains the parameters applied to the route:

```ts
import { sample } from 'effector';

const userRoute = createRoute({ path: '/user/:id' });

sample({
  clock: userRoute.opened,
  source: userRoute.$params,
  fn: (params, openPayload) => ({ params, openPayload }),
  target: routeOpenedFx,
});
```

Subscribe to `$params` directly when every parameter update matters, including updates while the route remains open:

```ts
userRoute.$params.watch((params) => {
  console.log('Applied user id:', params.id);
});
```

For platform-specific SSR handling, use `openedOnServer` or `openedOnClient` instead of the combined `opened` event.

### Nested Routes (Parent)

Create route hierarchies where child routes inherit their parent's path and lifecycle:

```ts
import { createRoute } from '@effector/router';

const profileRoute = createRoute({ path: '/profile/:userId' });

// Child routes inherit parent path
const friendsRoute = createRoute({
  path: '/friends',
  parent: profileRoute,
});
//    Full path: /profile/:userId/friends

const postsRoute = createRoute({
  path: '/posts',
  parent: profileRoute,
});
//    Full path: /profile/:userId/posts

// Opening child opens parent
postsRoute.open({ params: { userId: '123' } });
// profileRoute.$isOpened → true
// postsRoute.$isOpened → true
```

#### Parent Lifecycle

Parent routes open automatically when children open:

```ts
import { sample } from 'effector';

const parentRoute = createRoute({ path: '/parent' });
const childRoute = createRoute({ path: '/child', parent: parentRoute });

// Track parent opening
sample({
  clock: parentRoute.opened,
  fn: () => console.log('Parent opened'),
});

// Opens both parent and child
childRoute.open();
```

### Deprecated `beforeOpen`

`createRoute({ beforeOpen })` is kept for compatibility. It runs exactly once
after the history adapter confirms the new location. It is therefore not a
transition guard: the URL has already changed when the Effect starts. If it
fails, the route does not emit `opened`, while the Effect exposes its normal
`fail`/`failData` events. A route that was already open is closed so stale
params cannot remain active for the new URL.

For new code, derive readiness with `chainRoute`:

```ts
const readyProfileRoute = chainRoute({
  route: profileRoute,
  beforeOpen: loadUserFx,
});
```

Use `readyProfileRoute.$isPending` for model preparation. To hold history before
commit, use `beforeNavigate` instead.

### Open with Query Parameters

```ts
const searchRoute = createRoute({ path: '/search' });

searchRoute.open({
  query: { q: 'typescript', sort: 'recent' },
});
// URL: /search?q=typescript&sort=recent
```

### Replace History Entry

```ts
const route = createRoute({ path: '/page' });

route.open({ replace: true });
// Replaces current history entry instead of adding new one
```

## Best Practices

### Use Path Routes for URLs

Use path routes when the route should be reflected in the browser URL:

```ts
// ✅ Good: URL-based navigation
const productsRoute = createRoute({ path: '/products' });
const productRoute = createRoute({ path: '/product/:id' });
```

### Use Pathless Routes for UI State

Use pathless routes for UI elements that don't need URLs:

```ts
// ✅ Good: UI state without URL
const confirmDialog = createRoute<{ message: string }>();
const drawer = createRoute();
const tooltip = createRoute<{ text: string }>();
```

### Type Your Parameters

Always specify parameter types for type safety:

```ts
// ✅ Good: Typed parameters
const route = createRoute({ path: '/user/:id<number>' });

// ❌ Bad: Untyped (defaults to string)
const route = createRoute({ path: '/user/:id' });
```

### Compose Shared Policy Outside Route Creation

Use `parent` for path hierarchy. Compose authorization or confirmation from a
shared controls instance:

```ts
const adminRoute = createRoute({ path: '/admin' });
const usersRoute = createRoute({ path: '/users', parent: adminRoute });
const settingsRoute = createRoute({ path: '/settings', parent: adminRoute });

beforeNavigate({
  controls,
  to: [adminRoute, usersRoute, settingsRoute],
  filter: $unauthorized,
});
```

## See Also

- [createRouter](/core/create-router) - Create router with routes
- [createVirtualRoute](/core/create-virtual-route) - Create virtual routes
- [beforeNavigate](/core/before-navigate) - Hold transitions before history
- [chainRoute](/core/chain-route) - Derive post-commit readiness
- [@effector/router-paths](https://github.com/effector/router/tree/main/packages/router-paths) - Path parameter syntax
