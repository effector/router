# RouterProvider

Provides an effector/router `Router` to Solid components that use router context.

## API

```tsx
function RouterProvider(props: {
  router: Router;
  children?: JSX.Element;
}): JSX.Element;
```

## Usage

```tsx
import { RouterProvider } from '@effector/router-solid';

function App() {
  return (
    <RouterProvider router={router}>
      <RoutesView />
    </RouterProvider>
  );
}
```

`RouterProvider` is required by [`Link`], [`useLink`], [`useRouter`], and [`useRouterContext`]. Those APIs throw when no router is present. Route views, [`useIsOpened`], and [`useOpenedViews`] subscribe to the units passed to them and do not read this context directly.

For an Effector fork, place the `effector-solid` provider outside the router provider:

```tsx
import { Provider } from 'effector-solid';

<Provider value={scope}>
  <RouterProvider router={router}>
    <RoutesView />
  </RouterProvider>
</Provider>;
```

[`Link`]: /solid/link
[`useIsOpened`]: /solid/use-is-opened
[`useLink`]: /solid/use-link
[`useOpenedViews`]: /solid/use-opened-views
[`useRouterContext`]: /solid/use-router
[`useRouter`]: /solid/use-router
