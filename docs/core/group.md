# group

Create a virtual route that opens when any of the passed routes is opened, and closes when all passed routes are closed.

## API

```typescript
function group(
  routes: Array<Route<any> | VirtualRoute<any, any>>,
): VirtualRoute;
```

### Parameters

| Parameter | Type                                          | Description                                |
| --------- | --------------------------------------------- | ------------------------------------------ |
| `routes`  | `Array<Route<any> \| VirtualRoute<any, any>>` | Path, pathless, or virtual routes to group |

### Returns

`VirtualRoute` - A virtual route that tracks the combined state of all passed routes.

## Usage

### Basic Example

```ts
import { group, createVirtualRoute } from '@effector/router';

const signInRoute = createVirtualRoute();
const signUpRoute = createVirtualRoute();
const authorizationRoute = group([signInRoute, signUpRoute]);

signInRoute.open(); // authorizationRoute.$isOpened → true
signUpRoute.open(); // authorizationRoute.$isOpened → true
signInRoute.close(); // authorizationRoute.$isOpened → true (signUpRoute still open)
signUpRoute.close(); // authorizationRoute.$isOpened → false (all closed)
```

Regular routes do not expose a public `close()` method. Their open state follows router navigation, as shown in the examples below. Use virtual routes when the grouped states must be opened and closed manually.

### Guard Multiple Routes

```ts
import { group, createRoute, createRouter } from '@effector/router';
import { sample } from 'effector';

const profileRoute = createRoute({ path: '/profile' });
const settingsRoute = createRoute({ path: '/settings' });
const dashboardRoute = createRoute({ path: '/dashboard' });

const authenticatedRoutes = group([
  profileRoute,
  settingsRoute,
  dashboardRoute,
]);

// Redirect to login if trying to access any authenticated route
sample({
  clock: authenticatedRoutes.opened,
  filter: () => !isAuthenticated(),
  target: loginRoute.open,
});
```

### Track Section State

```ts
import { group, createRoute } from '@effector/router';
import { useUnit } from 'effector-react';

const productsRoute = createRoute({ path: '/shop/products' });
const cartRoute = createRoute({ path: '/shop/cart' });
const checkoutRoute = createRoute({ path: '/shop/checkout' });

const shopSection = group([productsRoute, cartRoute, checkoutRoute]);

function ShopIndicator() {
  const isShopActive = useUnit(shopSection.$isOpened);

  return (
    <div className={isShopActive ? 'shop-active' : ''}>
      Shopping Section
    </div>
  );
}
```

## How It Works

The `group` function creates a virtual route that:

- Opens when **any** of the grouped routes opens
- Closes when **all** of the grouped routes close
- Tracks combined pending state (`$isPending`) from all routes

This is useful for:

- Showing UI indicators for route sections
- Tracking navigation state across related routes

`group` is a derived virtual route, not a route-selection object for transition
policy. Pass a path-route array to `beforeNavigate({ to: [...] })` when several
routes share the same pre-commit rule.

## See Also

- [createVirtualRoute](/core/create-virtual-route) - Create custom virtual routes
- [createRoute](/core/create-route) - Create regular routes
- [chainRoute](/core/chain-route) - Create sequential route chains
- [beforeNavigate](/core/before-navigate) - Hold transitions to route arrays
