# React binding documentation tasks

Audit scope: `packages/react/README.md`, every page in `docs/react/`, all files in `packages/react/lib/`, and all four React test files. The React suite passes (17 tests), but it does not exercise several APIs that have detailed documentation.

## Актуализация документации

- [ ] Rewrite the `useRouter` page around the actual unit shape. `useRouter()` calls `useUnit(router)`, and the router's `@@unitShape` returns `{ query, path, activeRoutes, onBack, onForward, onNavigate }`. The docs instead claim it returns the router object with `$path`, `$query`, `$activeRoutes`, `back`, `forward`, and `navigate`. Document the real names/values (or change the unit shape/API), and add direct hook tests for both `useRouter` and `useRouterContext`.

- [x] Fix the Effector scope import in `docs/react/router-provider.md`. The example imports `fork` from `effector-react`, but `fork` is exported by `effector`; only `Provider` comes from `effector-react`. Typecheck the complete setup snippet.

- [ ] Replace the misleading lazy-loading/preloading section. Route opening already waits for the registered dynamic import before the route becomes opened; the documented `beforeOpen` effect that calls `profileRoute.open()` recursively opens the same route and is not a valid preload pattern. Explain when the import starts, what `$isPending` does, and whether the Suspense fallback is observable in normal navigation; add timing/fallback tests.

- [ ] Correct route selection terminology in `createRoutesView`. It renders `.at(-1)` from opened views in the original `routes` array order, not the route that opened most recently. Document declaration-order priority or track actual open order, with a test that opens multiple simultaneously active virtual/pathless routes in reverse order.

- [x] Fix the non-compiling route generic in `docs/react/use-link.md`. `createRoute<{ userId: string; tab?: string }>({ path: ... })` passes an object as the path generic; use path inference (and put optional params in the path template if supported) so the type-safety example demonstrates the actual core API.

- [ ] Replace the standalone pathless-route example in `useOpenedViews`. It calls `open()` on unregistered `createRoute()` values and expects them to become opened alongside the home route, but core pathless routes only open through router mapping/history. Use `createVirtualRoute` for independent layers or show mapped pathless routes.

- [x] Do not call `useIsOpened` inside a loop in the active-tabs example. Hooks inside `tabs.map(...)` violate the Rules of Hooks. Extract a `Tab` component that calls the hook once at component top level.

- [x] Document the supported nested-router RouteView use case. `RouteView.route` accepts a `Router`, `useOpenedViews` handles router activity, and the test suite devotes substantial coverage to nested routers, but the React API pages describe `route` only as a `createRoute` result. Add the supported pattern and clarify that it applies to eager route views, not the current lazy implementation.

### GitHub issues

- [ ] #29 Docs: avoid full-page rerenders on route transitions
- [ ] #33 Docs/tracking: dynamic chunks loading

## Модификация поведения

- [ ] Correct `useLink` navigation examples or curry the supplied params. The hook uses its `params` argument only to build `path` and returns the raw route `onOpen` event. Calling `onOpen()` for a parameterized route, as most examples do, does not reuse those params and cannot build the target URL. Either return a handler that opens with the captured params, or show `onOpen({ params })` consistently; add a direct `useLink` test.

- [ ] Make `<Link>`'s real browser URL include query parameters. The component builds `href` from route params only and applies `query` only in the intercepted click handler. Modified clicks and `target="_blank"`, which the docs explicitly promise to delegate to the browser, therefore open a URL without the documented query. Build a complete href or narrow the documented behavior, and test ctrl/meta click plus `_blank`.

- [ ] Preserve or stop documenting `children` in `createLazyRouteView`. `CreateLazyRouteViewProps` and the guide accept nested route views, but the implementation returns only `{ route, view }` and silently drops `children`, so `Outlet` cannot render them. Add parity tests with `createRouteView`.

- [ ] Restrict lazy views to supported route targets. The shared prop type allows `Route | Router`, but `createLazyRouteView` casts the target to `InternalRoute` and calls `internal.setAsyncImport`, which a router does not provide. Either implement lazy router views or exclude `Router` from this API and document the distinction.

- [ ] Implement or remove the documented multi-level `Outlet` example. `createRoutesView` provides context for the top-level view, but `Outlet` renders a selected child without providing a new `OutletContext` for that child's children. Existing tests cover one level only; add a three-level test matching the guide.

- [ ] Preserve nested route metadata in `withLayout`. The function maps only `{ route, view }` and drops `children`, so it is not equivalent to the `layout` prop for route views that own an `Outlet`. Keep all RouteView fields and add a nested-layout regression test.

### GitHub issues

- [ ] #70 [Bug]: createLazyRouteView drops nested children

## Контроль качества

- [ ] Add documentation conformance coverage for currently untested public APIs: `useRouter`, `useRouterContext`, `useLink`, `useIsOpened`, lazy loading/fallback/children, layout preservation, multi-level outlets, Link query behavior under native navigation, and declaration-order priority.
