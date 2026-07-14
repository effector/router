# chainRoute

Creates a post-commit readiness route from an already activated route.
`chainRoute` prepares data or state after history has changed; use
[`beforeNavigate`](/core/before-navigate) when navigation itself must be held.

## API

```ts
function chainRoute<T>({
  route: Route<T> | VirtualRoute<RouteOpenedPayload<T>, T>,
  beforeOpen: CallableUnit | CallableUnit[],
  openOn?: Unit | Unit[],
  cancelOn?: Unit | Unit[],
}): VirtualRoute<RouteOpenedPayload<T>, T>
```

`beforeOpen` accepts existing callable Effector events and effects. Units run in
array order; Effects are awaited. No router-specific task primitive is needed.

## Effect shorthand

When `openOn` is omitted, the chained route opens as soon as `beforeOpen`
finishes successfully:

```ts
const loadUserFx = createEffect(async ({ params }) =>
  api.getUser(params.userId),
);

export const readyUserRoute = chainRoute({
  route: routes.user,
  beforeOpen: loadUserFx,
});
```

An Effect failure cancels the current chained attempt. Observe the reason from
the Effect's normal `fail` or `failData` units.

## Explicit completion and cancellation

Use `openOn` when preparation starts one flow and readiness arrives through
another unit:

```ts
const authorized = createEvent();
const rejected = createEvent();

const authorizedRoute = chainRoute({
  route: routes.profile,
  beforeOpen: checkAuthorizationFx,
  openOn: authorized,
  cancelOn: rejected,
});
```

If an `openOn` signal fires while a `beforeOpen` Effect is still running, it is
remembered and the route opens after preparation succeeds. `cancelOn` closes an
already opened chain or cancels a pending one and emits `cancelled`.

## Pending

`chained.$isPending` is true from the parent route's `opened` event until one of
these terminal states:

- the chained route opens;
- preparation fails;
- `cancelOn` fires;
- the parent closes.

This includes time spent waiting for an explicit `openOn` signal.

```ts
sample({
  clock: readyUserRoute.$isPending,
  target: pageProgress.changed,
});
```

## Repeated activation

Repeated parent activation is `takeLatest`. A new payload starts a new attempt,
closes the previously opened derived route, and ignores late Effect results
from older attempts.

## Chaining concerns

Because the result is a virtual route, readiness can be derived in layers:

```ts
const authorized = chainRoute({
  route: routes.admin,
  beforeOpen: checkRoleFx,
});

const ready = chainRoute({
  route: authorized,
  beforeOpen: loadAdminDataFx,
});
```

Use this for post-commit authorization/readiness UI, not for protecting a URL
from entering history. For a true transition guard, compose
`beforeNavigate({ controls, to: routes.admin, ... })`.

## Lifecycle summary

1. Parent `opened` starts preparation and pending.
2. Callable units execute sequentially.
3. Successful preparation auto-opens, or waits for `openOn` when supplied.
4. Error, `cancelOn`, or parent close cancels pending.
5. A newer parent activation supersedes the older attempt.

See [Navigation lifecycle](/core/navigation-lifecycle) for the pre-/post-commit
boundary.
