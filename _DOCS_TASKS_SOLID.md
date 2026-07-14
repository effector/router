# Documentation tasks: `@effector/router-solid`

Scope audited: `packages/solid/README.md`, `packages/solid/package.json`, all of
`docs/solid`, `packages/solid/lib`, and `packages/solid/tests`.

## Актуализация документации

- [x] Make both quick-start examples runnable by showing router history initialization.
  - `packages/solid/README.md:21-55` and `docs/solid/index.md:31-81` create a router and render route views, but never call `router.setHistory(...)`; the README only leaves a parenthetical pointer to unspecified history setup, while the docs example gives no warning at all.
  - Core explicitly requires initialization (`docs/core/create-router.md:17-24`; `packages/core/lib/create-router.ts:54`), and every Solid integration test initializes the router (`packages/solid/tests/index.test.tsx:26,65`; `packages/solid/tests/example-app.test.tsx:109,120,135,150,165`). Without it no initial route is opened and the shown `<Link>` is not reachable.
  - Add the concrete adapter/history imports and initialization to the examples, and include any directly imported history package in the install command (or link immediately to a complete, runnable setup).
  - Test gap: add a compile/smoke test for the documented quick start so omission of required initialization cannot recur.

- [ ] Replace the “full guides and API reference” promise with real Solid API pages, or narrow the promise and remove dead source links.
  - `packages/solid/README.md:83-85` advertises full guides/reference at `/solid`, but `docs/solid` contains only `index.md`, and the Solid sidebar has only “Overview” (`docs/.vitepress/config.mts:128-132`).
  - The implementation links to pages that do not exist: `create-route-view.html`, `create-lazy-route-view.html`, `create-routes-view.html`, `link.html`, `outlet.html`, `use-router.html`, and `with-layout.html` (the corresponding `@link` entries are in `packages/solid/lib`). There are also no Solid pages for the exported `useLink`, `useIsOpened`, or `useOpenedViews` helpers.
  - Cover the actual signatures, accessor usage, provider requirement, errors, route parameters, `query`/`replace` and native anchor behavior, fallback/lazy behavior, layouts, nested routes, and router-backed views. Add `useRouterContext` to the reference or stop exporting it publicly (`packages/solid/lib/index.ts:6`).
  - Test gap: add a docs link checker (including source-code `@link` URLs) and type-check executable snippets against the package entry point.

- [ ] Correct the accessor wording for `useLink` in both overview documents.
  - `packages/solid/README.md:80-81` and `docs/solid/index.md:20-21` say `useLink`, `useIsOpened`, and `useOpenedViews` return accessors.
  - In fact `useIsOpened` and `useOpenedViews` directly return accessors, but `useLink` returns an object `{ path, onOpen }`; only `path` is an accessor (`packages/solid/lib/use-link.ts:12-35`). Document the exact call shape, including that the second argument is a params accessor rather than a params object.
  - Test gap: current tests exercise `Link`'s rendered `href`, but never call `useLink` directly or verify that changing its params accessor recomputes `path` (`packages/solid/tests/index.test.tsx:58-81`).

## Модификация поведения

- [ ] Reconcile `withLayout` documentation with nested `RouteView` behavior and preserve route metadata.
  - The docs describe `withLayout` as wrapping route views (`docs/solid/index.md:115-136`) and the public route-view contract supports recursive `children` (`packages/solid/lib/types.ts:6-10,25-29`).
  - `withLayout` destructures only `route` and `view` and returns only those fields (`packages/solid/lib/with-layout.tsx:33-46`), silently discarding `children`. Applying the documented helper to a parent view therefore breaks its documented `Outlet` composition.
  - Preserve `children` (and future `RouteView` metadata) while wrapping `view`, then document whether layouts apply only to the selected view or recursively to descendants.
  - Test gap: the sole metadata-preservation assertion covers `createLazyRouteView.children`; there is no `withLayout` test (`packages/solid/tests/index.test.tsx:83-98`). Add a parent/child case proving the child still renders through `Outlet` after layout wrapping.

- [ ] Define and implement the supported nesting depth for `Outlet`; the recursive type currently overpromises multi-level nesting.
  - `RouteView.children` is recursive (`packages/solid/lib/types.ts:25-29`), and `Outlet` is described as the nested-routes component (`packages/solid/lib/outlet.tsx:6-33`).
  - `createRoutesView` provides the selected top-level view's children (`packages/solid/lib/create-routes-view.tsx:43-48`), but `Outlet` renders the selected child without providing that child's own `children` (`packages/solid/lib/outlet.tsx:35-44`). A grandchild `<Outlet>` therefore reuses the parent's child list instead of descending to the next level.
  - Wrap the rendered child in a new `OutletContext.Provider` (or explicitly restrict and document nesting to one level) and add a three-level route/view example to the Solid docs.
  - Test gap: neither Solid test file imports or renders `Outlet`; add one-level, multi-level, and no-active-child cases.

## Verification snapshot

- `pnpm :solid test` — passed: 2 test files, 8 tests.
- No source or documentation files were changed by this audit; this checklist is the only Solid-phase output.
