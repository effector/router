# Solid and Core API gaps

This file records API and typing gaps discovered while building the SolidJS
consumer application in `examples/solid-router`. The items are intentionally
kept separate from the integration-test plan so they can be fixed and removed
independently.

## Confirmed issues

### 1. Parent route params are missing from child route types

`createRoute({path: '/tasks/:taskId', parent: projectRoute})` infers only the
child segment. The built route still needs the parent `projectId`, so consumer
code has to cast params when using `Link` or `useLink`.

Impact:

- child links are not fully type-safe;
- route builders and route state expose different parameter contracts;
- the Solid consumer app needed `as any` for nested links.

Suggested direction: derive the child route params as the intersection of the
parent route params and the child path params, while preserving the current
runtime builder behavior.

### 2. `VirtualRoute` is not assignable to `Route`

`group`, `createVirtualRoute`, and `chainRoute` return `VirtualRoute`, but the
Solid helpers accept `Route | Router`. The types differ notably in the
payload of `open` and in `$params`, so valid virtual routes require casts when
passed to `useIsOpened`, `createRouteView`, or related helpers.

Suggested direction: introduce a shared public route/viewable-route contract
for path routes, pathless routes, and virtual routes, or widen the Solid helper
signatures to the exact virtual-route shape.

### 3. `withLayout` drops nested route children

`withLayout` maps each view to a new object containing only `route` and
`view`. A `RouteView.children` tree is lost when a parent view is wrapped by a
layout.

Impact: a parent route wrapped with `withLayout` cannot reliably render its
nested `Outlet` tree.

Suggested direction: preserve `children` when mapping the views and add a
regression test for a layout-wrapped parent with an active child route.

### 4. `createLazyRouteView` dropped nested route children (resolved)

`CreateLazyRouteViewProps` allowed `children`, but the Solid implementation
returned only `route` and `view`. Lazy parent routes therefore lost their
nested outlet configuration. The Solid binding now returns `children` and has a
regression test covering the contract.

The same runtime gap remains in the React binding and should be fixed there
separately.

### 5. `Link.href` does not include the query payload

`Link` resolves `href` from the route path only. Its `query` prop is applied on
click through `onOpen`, but is absent from the rendered anchor href.

Impact: copy-link, native link preview, accessibility tooling, and no-script
fallbacks see an incomplete URL.

Suggested direction: expose a URL builder that serializes both route params
and query, then use it for `href` while keeping click navigation behavior.

## Follow-up checks

### 6. Lazy fallback behavior needs an explicit browser contract

The core route waits for the async bundle import before opening the route, and
the Solid binding also wraps the component in `Suspense`. A browser test should
define whether the fallback is expected during bundle loading or only during
component rendering, then lock that behavior down. In the current consumer
example, a direct deep-link to `/reports` can remain on the router fallback,
while entering the same lazy route through client-side navigation renders it
correctly. The E2E suite records the working client-navigation behavior and
keeps direct-refresh coverage on a non-lazy nested route.

### 7. Active-link styling is not part of `Link`

The Solid `Link` API forwards anchor props but does not expose an active-route
state or `activeClass`. This is not a runtime bug, but every consumer must
implement active styling separately. Decide whether this is intentional parity
with the current React binding or a future API addition.

## Verification context

These findings came from the Solid consumer app and package declarations, not
from speculative API review. The app keeps casts localized to the scenarios
above so the integration tests still exercise the runtime behavior directly.
