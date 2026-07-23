# Solid

SolidJS bindings for effector/router, providing components and reactive helpers for seamless integration.

::: warning Draft
`@effector/router-solid` is an early draft. Its API mirrors [`@effector/router-react`](/react/)
and may change before the first stable release. Only the current stable major of SolidJS (**1.x**)
is supported.
:::

## Overview

`@effector/router-solid` provides Solid-specific utilities to use effector/router in your Solid applications:

- **Route Views** - Connect routes to Solid components
- **Navigation Components** - [`Link`] and navigation helpers
- **Reactive helpers** - Access router state as Solid accessors
- **Layouts** - Wrap multiple routes with shared layouts

Unlike the React binding, [`useIsOpened`] and [`useOpenedViews`] return Solid accessors (`() => value`). [`useLink`] returns `{ path, onOpen }`: `path` is an accessor, `onOpen` is a callable Effector event, and the params argument is also an accessor.

## Installation

```bash
npm install @effector/router-solid @effector/router effector effector-solid solid-js history
```

## Quick Example

```tsx
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { createBrowserHistory } from 'history';
import {
  RouterProvider,
  createRouteView,
  createRoutesView,
  Link,
} from '@effector/router-solid';

// 1. Create routes
const homeRoute = createRoute({ path: '/' });
const aboutRoute = createRoute({ path: '/about' });

// 2. Create router
const router = createRouter({ routes: [homeRoute, aboutRoute] });
router.setHistory(historyAdapter(createBrowserHistory()));

// 3. Bind routes to components
const HomeScreen = createRouteView({
  route: homeRoute,
  view: () => (
    <div>
      <h1>Home</h1>
      <Link to={aboutRoute}>Go to About</Link>
    </div>
  ),
});

const AboutScreen = createRouteView({
  route: aboutRoute,
  view: () => (
    <div>
      <h1>About</h1>
      <Link to={homeRoute}>Go to Home</Link>
    </div>
  ),
});

// 4. Render the currently opened route
const RoutesView = createRoutesView({
  routes: [HomeScreen, AboutScreen],
});

// 5. Use in app
function App() {
  return (
    <RouterProvider router={router}>
      <RoutesView />
    </RouterProvider>
  );
}
```

## Using Route Parameters

Access route parameters with effector-solid's `useUnit`, which returns a Solid accessor:

```tsx
import { useUnit } from 'effector-solid';

const userRoute = createRoute({ path: '/user/:id' });

const UserScreen = createRouteView({
  route: userRoute,
  view: () => {
    const params = useUnit(userRoute.$params);
    return <div>User ID: {params().id}</div>;
  },
});
```

## Lazy Loading

Load route components on demand:

```tsx
import { createLazyRouteView } from '@effector/router-solid';

const ProfileScreen = createLazyRouteView({
  route: profileRoute,
  view: () => import('./screens/ProfileScreen'),
  fallback: () => <div>Loading...</div>,
});
```

## Layouts

Share layouts across multiple routes:

```tsx
import { withLayout } from '@effector/router-solid';

const MainLayout = (props) => (
  <div>
    <header>Header</header>
    {props.children}
    <footer>Footer</footer>
  </div>
);

const RoutesView = createRoutesView({
  routes: [
    ...withLayout(MainLayout, [HomeScreen, AboutScreen, ContactScreen]),
    LoginScreen, // Without layout
  ],
});
```

## APIs

The Solid binding mirrors the React one:

- [`RouterProvider`] — provide the router to the tree.
- [`createRouteView`] / [`createLazyRouteView`] — bind a route to a component (with optional lazy loading).
- [`createRoutesView`] — render the currently opened route, with an `otherwise` fallback.
- [`Link`], [`useLink`] — declarative and imperative navigation.
- [`withLayout`] — share a layout across routes.
- [`Outlet`], [`useRouter`], [`useIsOpened`], [`useOpenedViews`] — composition helpers.

## Next Steps

- [Core Package](/core/create-router) - Learn about core concepts
- [React bindings](/react/) - The stable reference implementation this binding mirrors

[`createLazyRouteView`]: /solid/create-lazy-route-view
[`createRoutesView`]: /solid/create-routes-view
[`createRouteView`]: /solid/create-route-view
[`Link`]: /solid/link
[`Outlet`]: /solid/outlet
[`RouterProvider`]: /solid/router-provider
[`useIsOpened`]: /solid/use-is-opened
[`useLink`]: /solid/use-link
[`useOpenedViews`]: /solid/use-opened-views
[`useRouter`]: /solid/use-router
[`withLayout`]: /solid/with-layout
