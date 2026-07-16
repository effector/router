# ☄️ @effector/router-react

[![npm](https://img.shields.io/npm/v/@effector/router-react.svg)](https://www.npmjs.com/package/@effector/router-react)

React bindings for [`@effector/router`](https://www.npmjs.com/package/@effector/router). Connect routes to
components, render the active route, and navigate with a `<Link>` — all driven by Effector state.

## Install

```bash
npm install @effector/router-react @effector/router effector effector-react react
```

## Quick start

```tsx
import { createRoute, createRouter } from '@effector/router';
import {
  RouterProvider,
  createRouteView,
  createRoutesView,
  Link,
} from '@effector/router-react';

// 1. Routes + router (see @effector/router for history setup)
const home = createRoute({ path: '/' });
const about = createRoute({ path: '/about' });
const router = createRouter({ routes: [home, about] });

// 2. Bind each route to a component
const HomeScreen = createRouteView({
  route: home,
  view: () => <Link to={about}>Go to About</Link>,
});
const AboutScreen = createRouteView({
  route: about,
  view: () => <Link to={home}>Back Home</Link>,
});

// 3. Render the active route
const Routes = createRoutesView({ routes: [HomeScreen, AboutScreen] });

export function App() {
  return (
    <RouterProvider router={router}>
      <Routes />
    </RouterProvider>
  );
}
```

Read route params in a view with Effector's `useUnit`:

```tsx
import { useUnit } from 'effector-react';

const UserScreen = createRouteView({
  route: userRoute, // createRoute({ path: '/user/:id' })
  view: () => {
    const { id } = useUnit(userRoute.$params);
    return <div>User {id}</div>;
  },
});
```

## API

- `RouterProvider` — provide the router to the tree.
- `createRouteView` / `createLazyRouteView` — bind a route to a component (with optional lazy loading).
- Lazy importers start when their view renders; preload is an application-owned
  Effect and never a recursive `route.open()` call.
- `createRoutesView` — render the currently opened route, with an `otherwise` fallback.
- Selection is declarative: active parents are suppressed by active children and
  the last declared remaining view wins.
- `Link`, `useLink` — declarative and imperative navigation.
  Both build the same effective href as `route.open`: omitted query preserves
  current query, explicit query replaces it, and `{}` clears it.
  Navigation interception is limited to ordinary primary-button, same-origin
  `_self` clicks; modified, secondary, download, and non-`_self` clicks remain
  native.
- `withLayout` — share a layout across routes. Views returned by one call share
  a private group identity, so the layout stays mounted while siblings switch.
- `Outlet`, `useRouter`, `useIsOpened`, `useOpenedViews` — composition helpers.
  `Outlet` recursively provides selected child views, so nested trees can be
  rendered without a depth limit.

## Polyfills

May require a polyfill for `Array.prototype.at()` in older environments.

## Documentation

Full guides and API reference: **[router.effector.dev/react](https://router.effector.dev/react)**

## License

[MIT](https://github.com/effector/router/blob/main/LICENSE)
