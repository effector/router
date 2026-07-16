# ☄️ @effector/router-solid

[![npm](https://img.shields.io/npm/v/@effector/router-solid.svg)](https://www.npmjs.com/package/@effector/router-solid)

> ⚠️ **Draft.** API mirrors [`@effector/router-react`](https://www.npmjs.com/package/@effector/router-react) and may change before the first stable release.

SolidJS bindings for [`@effector/router`](https://www.npmjs.com/package/@effector/router). Connect
routes to components, render the active route, and navigate with a `<Link>` — all driven by
Effector state.

Only the current major of SolidJS (**1.x**) is supported.

## Install

```bash
npm install @effector/router-solid @effector/router effector effector-solid solid-js history
```

## Quick start

```tsx
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { createBrowserHistory } from 'history';
import {
  RouterProvider,
  createRouteView,
  createRoutesView,
  Link,
} from '@effector/router-solid';

// 1. Routes + router
const home = createRoute({ path: '/' });
const about = createRoute({ path: '/about' });
const router = createRouter({ routes: [home, about] });
router.setHistory(historyAdapter(createBrowserHistory()));

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

Read route params in a view with effector-solid's `useUnit` (returns a Solid accessor):

```tsx
import { useUnit } from 'effector-solid';

const UserScreen = createRouteView({
  route: userRoute, // createRoute({ path: '/user/:id' })
  view: () => {
    const params = useUnit(userRoute.$params);
    return <div>User {params().id}</div>;
  },
});
```

## API

- `RouterProvider` — provide the router to the tree.
- `createRouteView` / `createLazyRouteView` — bind a route to a component (with optional lazy loading).
- `createRoutesView` — render the currently opened route, with an `otherwise` fallback.
- Selection is declarative: active parents are suppressed by active children and
  the last declared remaining view wins.
- `Link`, `useLink` — declarative and imperative navigation.
- `withLayout` — share a layout across routes. Views returned by one call share
  a private group identity, so the layout stays mounted while siblings switch.
- `Outlet`, `useRouter`, `useIsOpened`, `useOpenedViews` — composition helpers.
  `Outlet` recursively provides selected child views, so nested trees can be
  rendered without a depth limit.

Unlike the React binding, `useIsOpened` and `useOpenedViews` return Solid accessors (`() => value`). `useLink` returns `{ path, onOpen }`: `path` is an accessor, `onOpen` is a callable Effector event, and the params argument is also an accessor.

## Documentation

Full guides and API reference: **[router.effector.dev/solid](https://router.effector.dev/solid)**

## License

[MIT](https://github.com/effector/router/blob/main/LICENSE)
