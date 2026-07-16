# Link

Renders an anchor whose intercepted primary click opens an effector/router route.

## API

```tsx
function Link<Params extends object | void = void>(
  props: LinkProps<Params>,
): JSX.Element;
```

| Property  | Type            | Description                                       |
| --------- | --------------- | ------------------------------------------------- |
| `to`      | `Route<Params>` | Registered target route                           |
| `params`  | `Params`        | Required when the route has required parameters   |
| `query`   | `Query`         | Query passed to `route.open` on intercepted click |
| `replace` | `boolean`       | Replace rather than push on intercepted click     |
| `onClick` | anchor handler  | Runs before router navigation                     |
| `target`  | anchor target   | Non-`_self` targets use native browser behavior   |

All other Solid anchor attributes are forwarded.

```tsx
import { Link } from '@effector/router-solid';

<Link to={userRoute} params={{ id: '42' }} query={{ tab: 'activity' }} replace>
  Open user
</Link>;
```

Only an ordinary primary-button, same-origin `_self` click is intercepted.
Calling `preventDefault()` in `onClick` cancels router navigation. Modified,
secondary, download, cross-origin, and non-`_self` clicks are left to the
browser. The rendered `href` always includes complete route params and the
effective query: omission preserves the current query, an explicit object
replaces it, and `{}` clears it. The same payload passed to `route.open` produces
the same URL.

`Link` uses router context and throws when `to` is not registered in the provided router.

## `useLink`

`useLink(to, params, query)` is the imperative equivalent. `params` and `query`
are Solid accessors, so the returned `path` accessor updates when either value
changes. Call the returned `onOpen` event with the same payload used by
`route.open`.

```tsx
const [params, setParams] = createSignal({ id: '42' });
const link = useLink(userRoute, params);

return <a href={link.path()}>User</a>;
```
