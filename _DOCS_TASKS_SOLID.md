# Documentation tasks: `@effector/router-solid`

Scope audited: `packages/solid/README.md`, `packages/solid/package.json`, all of
`docs/solid`, `packages/solid/lib`, and `packages/solid/tests`.

## Модификация поведения

- [ ] Reconcile `withLayout` documentation with nested `RouteView` behavior and preserve route metadata.
  - The docs describe `withLayout` as wrapping route views (`docs/solid/index.md:115-136`) and the public route-view contract supports recursive `children` (`packages/solid/lib/types.ts:6-10,25-29`).
  - `withLayout` destructures only `route` and `view` and returns only those fields (`packages/solid/lib/with-layout.tsx:33-46`), silently discarding `children`. Applying the documented helper to a parent view therefore breaks its documented `Outlet` composition.
  - Preserve `children` (and future `RouteView` metadata) while wrapping `view`, then document whether layouts apply only to the selected view or recursively to descendants.
  - Test gap: the sole metadata-preservation assertion covers `createLazyRouteView.children`; there is no `withLayout` test (`packages/solid/tests/index.test.tsx:83-98`). Add a parent/child case proving the child still renders through `Outlet` after layout wrapping.

- [ ] #57 RFC: preserve shared layout instances across `withLayout` route transitions. Decide whether layout identity/preservation belongs to the shared RouteView contract or to a Solid-specific primitive; moving between two views in one layout group must not remount the layout.

- [ ] Define and implement the supported nesting depth for `Outlet`; the recursive type currently overpromises multi-level nesting.
  - `RouteView.children` is recursive (`packages/solid/lib/types.ts:25-29`), and `Outlet` is described as the nested-routes component (`packages/solid/lib/outlet.tsx:6-33`).
  - `createRoutesView` provides the selected top-level view's children (`packages/solid/lib/create-routes-view.tsx:43-48`), but `Outlet` renders the selected child without providing that child's own `children` (`packages/solid/lib/outlet.tsx:35-44`). A grandchild `<Outlet>` therefore reuses the parent's child list instead of descending to the next level.
  - Wrap the rendered child in a new `OutletContext.Provider` (or explicitly restrict and document nesting to one level) and add a three-level route/view example to the Solid docs.
  - Test gap: neither Solid test file imports or renders `Outlet`; add one-level, multi-level, and no-active-child cases.
