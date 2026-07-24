# useIsOpened

Returns a Solid accessor that reports whether a route or router is active.

## API

```ts
function useIsOpened(route: Route | Router): Accessor<boolean>;
```

```tsx
import { useIsOpened } from '@effector/router-solid';

function ProfileStatus() {
  const isOpened = useIsOpened(profileRoute);
  return <span>{isOpened() ? 'Profile is open' : 'Profile is closed'}</span>;
}
```

For a route, the accessor reads `$isOpened`. For a router, it returns `true` while `$activeRoutes` is non-empty. The hook reads the supplied Effector unit directly and does not require router context.
