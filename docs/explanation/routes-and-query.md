# Routes and query

effector/router treats the pathname and the search string as two objects:

1. The route owns path identity and params (`$params`, `opened`, `updated`).
2. Controls own the query (`$query`, [`trackQuery`](/core/track-query)).
3. A navigation command may write both in one call.
4. A later reaction still belongs on the object that owns the state.

[`chainRoute`](/core/chain-route) derives a route after the parent opens. Query
changes are not a parent activation. List loading that depends on search
composes from `$query` or `trackQuery`, with ordinary `sample` and effects.

## Ownership

| Layer         | Route                                              | Query                                              |
| ------------- | -------------------------------------------------- | -------------------------------------------------- |
| State         | `$params`, `$isOpened`                             | `controls.$query` / `router.$query`                |
| Facts         | `opened`, `updated`, `closed`                      | `$query` updates; `trackQuery` `entered` / `exited` |
| Derived form  | [`chainRoute`](/core/chain-route)                  | [`trackQuery`](/core/track-query)                  |
| Meaning       | which resource is open                             | extra state on the current location                |

[`route.updated`](/core/create-route) reports a params change on an already open
route. A query-only commit does not emit it, does not call `navigated`, and does
not run `chainRoute`. Query is observed through `$query` and query trackers.

## Design rationale

Path params name a resource. `/products/:id` with `id=2` is a different product
than `id=1`. Matching still uses the same template, so `$isOpened` can stay
true, but the activation payload changed: `opened` / `updated` fire, and a
readiness chain may run again.

Query is extra state on that location: filters, page number, a tab, a flag for
a modal. Changing `?foo=bar` does not leave the page. The route stays open. A
view gated on `$isOpened` should not unmount. Authorization that already
succeeded in `chainRoute` should not run again.

`trackQuery` exists because query has its own ownership: which keys a feature
writes, schema validation, `enter` / `exit`. It is not a second data-loading
operator for the same job as `chainRoute`. `chainRoute` produces a route.
`trackQuery` produces a tracker. Data loading is `sample` plus an effect; the
clock is the object whose state changed.

## Navigation commands

`route.open({ params, query })` is one navigation intent. It may update the path
and the search together. The `opened` payload includes a query snapshot so the
first activation can see the URL as committed.

That snapshot is not a subscription. A later `route.open({ query: { foo: 'bar' } })`
writes the query object and leaves the route open. `chainRoute` listens to
`opened`, so it does not run again.

Persisting filters with `route.open` and loading them in `beforeOpen` therefore
survives reload (a full load produces `opened` with the query already in the
URL) and freezes the list when the filter changes in place (the route never
closed).

## Composition

Readiness stays on the route. Nested chains are more readiness, still on that
object: session, then bootstrap that depends on params.

```ts
const authorized = chainRoute({
  route: routes.product,
  beforeOpen: checkSessionFx,
});

const ready = chainRoute({
  route: authorized,
  beforeOpen: loadProductFx,
});
```

`ready.$isOpened` is the gate for the view. A later query change does not close
`ready`.

Filter state is read from the query object. The route clock covers enter and
reload; `$query` covers in-page writes, including `route.open({ query })` and
`controls.navigate({ query })`:

```ts
sample({
  clock: authorized.opened,
  source: controls.$query,
  target: loadListFx,
});

sample({
  clock: controls.$query,
  filter: authorized.$isOpened,
  target: loadListFx,
});
```

Pending for that work is `loadListFx.pending`, not the page route's
`$isPending`. `createRouteView({ route: chained })` still gates UI on route
readiness.

When a feature owns a set of keys and wants validation, derive a tracker from
the same query object:

```ts
const filters = trackQuery({
  controls,
  routes: [routes.product],
  parameters: z.object({
    foo: z.string(),
  }),
});

sample({
  clock: filters.entered,
  target: loadListFx,
});
```

`entered` fires for each new successful parse, including a later change of the
same keys. `enter` / `exit` write only those keys. Writing through
`route.open({ query })` still updates `$query`; the tracker is the reaction,
not a second way to open the route.

## Non-goals

- Restarting `chainRoute` on a query-only `route.open`.
- Reading `route.updated` as any URL change. It is params on an open route.
- Putting `$query` on the route so a chain restarts on every filter.
- A router-specific data-loading primitive. Load with `sample` and an effect.
