# Link

Navigation component that renders an anchor tag and handles route opening on click.

## Import

```ts
import { Link } from '@effector/router-react';
```

## Usage

```text
import { Link } from '@effector/router-react';
import { profileRoute, postRoute } from './routes';

function Navigation() {
  return (
    <nav>
      &lt;Link to={profileRoute}&gt;Profile&lt;/Link&gt;
      &lt;Link to={postRoute} params={ { id: '123' } }&gt;
        View Post
      &lt;/Link&gt;
    </nav>
  );
}
```

## With Parameters

Pass route parameters:

```text
import { Link } from '@effector/router-react';
import { createRoute } from '@effector/router';

const userRoute = createRoute({ path: '/user/:id' });

function UserList({ users }) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          &lt;Link to={userRoute} params={ { id: user.id } }&gt;
            {user.name}
          &lt;/Link&gt;
        </li>
      ))}
    </ul>
  );
}
```

## With Query Parameters

Add query parameters to the URL:

```text
&lt;Link to={searchRoute} query={ { q: 'react', sort: 'popular' } }&gt;
  Search React
&lt;/Link&gt;
```

The `href` always includes the complete path params and effective query. When
`query` is omitted, the current router query is preserved; an explicit object
replaces it, and `{}` clears it. Calling `route.open` with the same payload
produces the same URL.

## Replace Navigation

Use `replace` to replace current history entry:

```text
&lt;Link to={loginRoute} replace&gt;
  Login
&lt;/Link&gt;
```

## Props

### `to` (required)

The route to navigate to:

```text
&lt;Link to={homeRoute}&gt;Home&lt;/Link&gt;
```

### `params` (optional)

Route parameters (required if route has parameters):

```text
const userRoute = createRoute({ path: '/user/:id/:tab' });

&lt;Link to={userRoute} params={ { id: '123', tab: 'posts' } }&gt;
  User Posts
&lt;/Link&gt;;
```

### `query` (optional)

Query parameters to add to the URL:

```text
&lt;Link to={searchRoute} query={ { q: 'term', filter: 'active' } }&gt;
  Search
&lt;/Link&gt;
```

### `replace` (optional)

Replace current history entry instead of pushing:

```text
&lt;Link to={homeRoute} replace&gt;
  Home
&lt;/Link&gt;
```

### Standard Anchor Props

All standard HTML anchor props are supported:

```text
&lt;Link
  to={externalRoute}
  className="nav-link"
  target="_blank"
  rel="noopener noreferrer"
>
  External Link
&lt;/Link&gt;
```

`Link` also forwards a ref to the underlying `<a>` element, so focus and
measurement work like they do for a native anchor. Route parameters remain
conditionally required by `LinkProps`: a route with `:id` requires
`params={ {id: ...} }`, while a path without parameters accepts omitted params.

## Behavior

### Click Handling

The Link component:

- Intercepts only an ordinary primary-button, same-origin `_self` click
- Opens the route via effector/router Router
- Respects modifier keys (cmd/ctrl click opens in new tab)
- Preserves native behavior for secondary clicks, downloads, non-`_self`
  targets, and cross-origin URLs
- Allows custom `onClick` handlers
- Supports `e.preventDefault()` to cancel navigation

```text
&lt;Link
  to={profileRoute}
  onClick={(e) => {
    if (!user.isLoggedIn) {
      e.preventDefault();
      showLoginModal();
    }
  }}
>
  Profile
&lt;/Link&gt;
```

### External Links

Links with `target` attribute other than `_self` use default browser behavior:

```text
&lt;Link to={docsRoute} target="_blank"&gt;
  Open Docs in New Tab
&lt;/Link&gt;
```

### Modifier Keys

Holding modifier keys uses browser's default behavior:

- `Cmd/Ctrl + Click` - Open in new tab
- `Shift + Click` - Open in new window
- `Alt/Option + Click` - Download
- `Ctrl + Shift + Click` - Open in new window (some browsers)

## Type Safety

Parameters are type-checked:

```text
const postRoute = createRoute({ path: '/post/:id' });

// ✅ Correct
&lt;Link to={postRoute} params={ { id: '123' } }&gt;Post&lt;/Link&gt;

// ❌ TypeScript error - missing params
&lt;Link to={postRoute}&gt;Post&lt;/Link&gt;

// ❌ TypeScript error - wrong type
&lt;Link to={postRoute} params={ { id: 123 } }&gt;Post&lt;/Link&gt;
```

## Styling

Style like a regular anchor tag:

```text
&lt;Link
  to={homeRoute}
  className="nav-link active"
  style={ { color: 'blue', textDecoration: 'none' } }
>
  Home
&lt;/Link&gt;
```

## Ref Support

Link supports refs:

```text
import { useRef } from 'react';

function Navigation() {
  const linkRef = useRef<HTMLAnchorElement>(null);

  return (
    &lt;Link ref={linkRef} to={homeRoute}&gt;
      Home
    &lt;/Link&gt;
  );
}
```

## See Also

- [useLink](./use-link) - Hook for link functionality
- [createRouteView](./create-route-view) - Create route views
- [useRouter](./use-router) - Access router in components
