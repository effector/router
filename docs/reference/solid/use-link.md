# useLink

Builds a reactive path for a registered route and returns the route's callable `onOpen` event.

## API

```ts
function useLink<T extends object | void = void>(
  to: Route<T>,
  params?: Accessor<T>,
): {
  path: Accessor<string>;
  onOpen: EventCallable<RouteOpenedPayload<T>>;
};
```

The second argument is a Solid accessor, not a params object. Updating the accessor recomputes `path()`.

```tsx
import { createSignal } from 'solid-js';
import { useLink } from '@effector/router-solid';

function UserLink() {
  const [id, setId] = createSignal('42');
  const params = () => ({ id: id() });
  const { path, onOpen } = useLink(userRoute, params);

  return (
    <a
      href={path()}
      onClick={(event) => {
        event.preventDefault();
        onOpen({ params: params() });
      }}
    >
      Open user
    </a>
  );
}
```

`onOpen` is the raw route event; it does not capture the params accessor. Pass the required payload when calling it. The hook requires [`RouterProvider`] and throws when the route is absent from `router.knownRoutes`.

[`RouterProvider`]: /solid/router-provider
