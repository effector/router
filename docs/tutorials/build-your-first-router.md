---
title: Build your first router
---

# Build your first router

This tutorial builds a small React app with two pages — Home and Profile —
that navigate without a full page reload. By the end you'll have a router,
two route views, and a working `Link` between them.

## Prerequisites

- Node.js and a package manager (pnpm, npm, or yarn)
- Basic familiarity with React and Effector (`fork`, stores, events)
- Packages installed per [Getting started](/introduction/getting-started):
  `@effector/router`, `@effector/router-react`, and `history`

## What you'll build

A single-page app with a Home route (`/`) and a Profile route (`/profile`).
Clicking the link on either page navigates to the other, and the URL updates
via the browser's History API.

The full example below lives in one file for clarity. In a real app you'd
typically split routes, views, and the render entry point into separate
modules — see [Getting started](/introduction/getting-started) for that
layout.

## 1. Define routes

Routes are plain Effector units — no JSX, no components yet:

```tsx
import { createRoute } from '@effector/router';

const homeRoute = createRoute({ path: '/' });
const profileRoute = createRoute({ path: '/profile' });
```

## 2. Create the router

The router coordinates which route is open and reacts to navigation:

```tsx
import { createRouter } from '@effector/router';

const router = createRouter({ routes: [homeRoute, profileRoute] });
```

## 3. Create a view for each route

`createRouteView` ties a component to a route — it only renders while that
route is open:

```tsx
import { createRouteView, Link } from '@effector/router-react';

const Home = createRouteView({
  route: homeRoute,
  view: () => (
    <div>
      <h1>Home</h1>
      <Link to={profileRoute}>Go to profile</Link>
    </div>
  ),
});

const Profile = createRouteView({
  route: profileRoute,
  view: () => (
    <div>
      <h1>Profile</h1>
      <Link to={homeRoute}>Back home</Link>
    </div>
  ),
});
```

`Link` takes a route object directly as `to` — no path strings to keep in
sync.

## 4. Render whichever route is currently open

`createRoutesView` renders the first matching view from the list:

```tsx
import { createRoutesView } from '@effector/router-react';

const RoutesView = createRoutesView({ routes: [Home, Profile] });
```

## 5. Provide the router to the React tree

`RouterProvider` makes the router available to `Link`, `Outlet`, and the
`use*` hooks used anywhere below it:

```tsx
import { RouterProvider } from '@effector/router-react';

function App() {
  return (
    <RouterProvider router={router}>
      <RoutesView />
    </RouterProvider>
  );
}
```

## 6. Initialize the router with browser history

A router has no location until you give it one. `setHistory` wires it to a
`history` instance inside an Effector scope, so navigation state is
predictable from the very first render:

```tsx
import { allSettled, fork } from 'effector';
import { Provider } from 'effector-react';
import { createRoot } from 'react-dom/client';
import { createBrowserHistory } from 'history';
import { historyAdapter } from '@effector/router';

const scope = fork();

async function main() {
  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(createBrowserHistory()),
  });

  createRoot(document.getElementById('root')!).render(
    <Provider value={scope}>
      <App />
    </Provider>,
  );
}

main();
```

## Expected result

Open the app: you land on Home at `/`. Click "Go to profile" — the URL
changes to `/profile`, the Profile view renders, and the browser's Back
button returns you to Home, all without a full page reload.

## Next steps

- [Adapters reference](/core/adapters) — how `historyAdapter` and
  `queryAdapter` decide where navigation state lives (browser history vs.
  query string), and how partial navigation targets are resolved.
- [Navigation lifecycle](/explanation/navigation-lifecycle) — what actually
  happens, in what order, between a navigation request and a route opening.
- [Routes and query](/explanation/routes-and-query) — why path params and
  query are different objects, and how to compose loading from each.
- [React reference](/react/) — the full API surface used above, plus
  `Outlet`, `withLayout`, and the `use*` hooks for nested routing.
