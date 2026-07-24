# Type guards

Use `is` to narrow an unknown value to a router or route shape at runtime.

## API

```ts
import { is } from '@effector/router';

is.route(input); // input is Route
is.pathRoute(input); // input is PathRoute
is.pathlessRoute(input); // input is PathlessRoute
is.router(input); // input is Router
```

`is` exposes four type guards:

| Guard                     | Narrows to         | Returns `true` when                       |
| ------------------------- | ------------------ | ----------------------------------------- |
| `is.route(input)`         | `Route<T>`         | `input` is a path route or pathless route |
| `is.pathRoute(input)`     | `PathRoute<T>`     | `input` has the path-route marker         |
| `is.pathlessRoute(input)` | `PathlessRoute<T>` | `input` has the pathless-route marker     |
| `is.router(input)`        | `Router`           | `input` has the router marker             |

## Usage

Use a guard before reading route- or router-specific units from a value whose
shape is not known statically:

```ts
import { is } from '@effector/router';

function inspect(input: unknown) {
  if (is.pathRoute(input)) {
    console.log(input.path);
    return;
  }

  if (is.pathlessRoute(input)) {
    input.open();
    return;
  }

  if (is.router(input)) {
    input.navigate({ path: '/' });
  }
}
```

`is.route(input)` is useful when path-specific behavior is not needed:

```ts
if (is.route(input)) {
  input.$isOpened.watch((opened) => console.log(opened));
}
```

## See also

- [createRoute](/core/create-route) - create path and pathless routes
- [createRouter](/core/create-router) - create router instances
