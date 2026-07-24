# useRouter and useRouterContext

Read the router provided by [`RouterProvider`].

## useRouter

`useRouter()` passes the router unit shape through `effector-solid`'s `useUnit`:

```tsx
import { useRouter } from '@effector/router-solid';

function NavigationStatus() {
  const { path, query, activeRoutes, onBack, onForward, onNavigate } =
    useRouter();

  return (
    <nav>
      <button onClick={() => onBack()}>Back</button>
      <button onClick={() => onForward()}>Forward</button>
      <span>{path()}</span>
      <span>{activeRoutes().length} active routes</span>
    </nav>
  );
}
```

`path`, `query`, and `activeRoutes` are Solid accessors. `onBack`, `onForward`, and `onNavigate` are callable Effector events.

## useRouterContext

`useRouterContext` is a public export for code that needs the raw `Router` instance rather than the accessor-based unit shape returned by `useRouter()`:

```ts
import { useRouterContext } from '@effector/router-solid';

const router = useRouterContext();
router.setHistory(adapter);
```

Both functions throw `[useRouter] Router not found. Add RouterProvider in app root` when called outside [`RouterProvider`].

[`RouterProvider`]: /solid/router-provider
