# Navigation lifecycle RFC

Status: accepted contract; implementation is covered by core and binding
regression tests.

## Goal

Keep the public API small and composable from ordinary Effector units. Routes
and controls can be created in `shared/routing`; the router and history adapter
remain application configuration. No public `task`, `barrier`, `blocker`,
`guard`, or transition object is introduced.

## Decision

Navigation has two distinct phases. They share an internal attempt coordinator,
but are intentionally different public operators.

```text
navigation intent
  -> beforeNavigate (pre-commit: proceed / cancel / redirect)
  -> history commit
  -> route activation
  -> chainRoute (post-commit: preparation / readiness)
  -> framework render (lazy import / fallback)
```

`beforeNavigate` cannot be implemented on top of the public `chainRoute`:
`chainRoute` starts from `route.opened`, after history has already committed.
Closing its virtual route can hide a view, but cannot restore correct history
semantics. Both operators therefore use the same private correlation primitive
as siblings:

- navigation attempts use `ignore` while held; a semantic redirect may replace
  the current attempt;
- chained readiness uses `takeLatest`; stale async results are ignored.

## Public API

### `beforeNavigate`

```ts
const transition = beforeNavigate({
  controls,
  from?: route | route[],
  to?: route | route[],
  filter?: Store<boolean> | ((navigation) => boolean),
})

transition.started // Event<void>
transition.proceed // EventCallable<void>
transition.cancel  // EventCallable<void>
```

When `filter` is omitted, a matching transition is held. A `Store<boolean>` or
predicate function can disable the hold for a particular state/navigation.
Complex policy is pre-composed with `Store.map`/`combine`; the operator does not
duplicate Effector's `source`/`filter` API. `from` and `to` are combined with
AND.

All matching operators must call `proceed`; any one may cancel. While an
attempt is held, later ordinary intents are ignored. This avoids exposing a
public attempt token and prevents a late confirmation from releasing the wrong
navigation. Adapters with `block` also hold native POP transitions. Adapters
without it can only guarantee interception of router commands.

### `redirect`

```ts
sample({
  clock: authorization.started,
  target: redirect({ to: routes.signIn, replace: true }),
});
```

`redirect({ to, replace? })` is a clock-less Effector target. Dynamic params
and query are its payload and are composed with `sample.fn`. A redirect
supersedes a held transition, goes through normal matching again, and has a
bounded consecutive-redirect check. There is no second navigation DSL with
`clock`, `source`, `params`, or `query` fields.

### `chainRoute`

`chainRoute({ route, beforeOpen, openOn?, cancelOn? })` remains the post-commit
readiness operator. `beforeOpen` accepts ordinary callable Effector events and
effects; effects are awaited sequentially. If `openOn` is omitted, successful
preparation opens the chained route automatically. If it is supplied, pending
continues until an `openOn` signal. Effect failure, `cancelOn`, or closing the
parent cancels the current attempt.

`$isPending` is true from parent activation until chained open/cancel/close.
Repeated parent activation is `takeLatest`; results from older attempts do not
open or overwrite the current route.

### Existing routes

`createRoute({ beforeOpen })` is deprecated. For compatibility it runs exactly
once after a confirmed location activation. It is not a history guard. New
preparation belongs in `chainRoute`; transition policy belongs in
`beforeNavigate`.

`createVirtualRoute` has no `beforeOpen` option. Its only lifecycle inputs are
`open`, `close`, an optional transformer, and an optional externally composed
`$isPending`.

## Lazy bindings

Core no longer registers or waits for framework dynamic imports. React and
Solid start the importer when the lazy view renders under `Suspense`; Vue starts
it when its async component renders. This makes the documented fallback
observable. Route/chained `$isPending` describes model preparation, not chunk
loading.

Preloading is application composition over the same importer:

```ts
const importProfile = () => import('./ProfilePage');
const preloadProfileFx = createEffect(importProfile);

const ProfilePage = createLazyRouteView({
  route: routes.profile,
  view: importProfile,
  fallback: ProfileSkeleton,
});
```

No recursive `route.open()` is used for preload.

## FSD ownership

```text
shared/routing
  routes.ts       createRoute declarations
  controls.ts     createRouterControls()

features/*, pages/*
  beforeNavigate({ controls, from/to, filter })
  sample(..., redirect(...))
  chainRoute(...) readiness models

app/routing
  createRouter({ routes, controls })
  controls.setHistory(historyAdapter(...))
```

Features depend on routes and controls, not on the configured router or browser
history. The application owns base paths, route registration, history, SSR,
and adapter choice.

## Motivation from adjacent designs

- Atomic Router's `chainRoute` is a derived readiness route triggered after the
  parent opens. Keeping that role avoids pretending it can cancel a history
  commit.
- Farfetched barriers model one useful mechanism: hold work, perform one shared
  recovery, then resume. They do not model redirect, history, or confirmation;
  copying the whole barrier abstraction would add the wrong public entity.
- React Router blockers expose proceed/reset around pre-commit navigation.
  Framework data routers separately model route loaders and pending UI. The
  phase split is useful even though this API expresses it with Effector units.
- With Ease's protocol-oriented integrations reinforce keeping framework and
  dependency coupling at package boundaries. Lazy loading therefore stays in
  bindings instead of a private core hook.

## Cancellation, errors, and redirects

- Cancel before commit: location and active routes do not change.
- Preparation error after commit: the preparation Effect exposes its normal
  `fail`/`failData`; the chained route is cancelled and pending ends. Deprecated
  route preparation closes a previously active route instead of retaining stale
  params.
- Redirect while held: the old attempt is discarded and the redirect becomes a
  new semantic attempt.
- Redirect loop: after 16 consecutive pre-commit redirects the current held
  attempt is cancelled and a diagnostic is emitted.
- Repeated ordinary intent while held: ignored.
- Repeated chained activation: latest activation wins.

## Non-goals

- A public transition/attempt object.
- A router-specific task or barrier primitive.
- A second API for data loading or error stores.
- Hiding post-commit loading behind a history guard.
- Moving router/history construction into `shared` solely to use policy
  operators.
