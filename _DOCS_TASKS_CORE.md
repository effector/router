# Core documentation tasks

Audit scope: `packages/core/README.md`, every page in `docs/core/`, the core-related getting-started material, all files in `packages/core/lib/`, and all core tests. The core suite passes (71 tests) after building the local `@effector/router-paths` dependency.

## Актуализация документации

- [ ] Document whether `navigate.query` replaces or merges the current query. The controls guide says to add/update query parameters, but `createRouterControls` serializes the supplied object as the complete search string. Examples that navigate first with `{ page }` and then `{ filter }` therefore lose `page`. State the replacement behavior or implement merging, and add a regression test.

- [ ] Use one accurate `Query` type everywhere. `docs/core/create-router-controls.md` documents `Record<string, string | string[] | undefined>`, while the exported type is `Record<string, string | null | Array<string | null>>`. Core JSDoc/examples also use numeric arrays (`[1, 2]`) that the public type rejects. Update all signatures and examples together.

- [ ] Correct `trackQuery` lifecycle and removal semantics. The guide describes `entered` as a transition when parameters appear, but the implementation/test suite emits it again for every valid query change. `exit()` clears the entire query, not only the schema's keys, unless `ignoreParams` explicitly lists keys to preserve. Document these behaviors or change the implementation, with tests for unrelated query parameters.

### GitHub issues

- [ ] #23 Docs: nested routes with params propagation

## Модификация поведения

- [ ] Make nested-route parameter documentation match the type/runtime contract. `docs/core/create-route.md` says a child with `path: '/posts'` and parent `'/profile/:userId'` can be opened with `{ params: { userId } }`, but `createRoute` infers params only from the child's own path. Either include parent params in the child route type or rewrite the guide around the actual supported pattern; add a type/runtime test where the parameter exists only on the parent.

- [ ] Resolve the adapter `location` contract inconsistency. The guide requires `adapter.location` to stay synchronized and says omitted object fields have common fallbacks, but both built-in adapters expose an initial snapshot, and `historyAdapter` delegates partial-object behavior to `history` while `queryAdapter` supplies its own `/`/empty fallbacks. Define the intended contract, update implementation/docs, and test partial targets plus `adapter.location` after navigation.

- [ ] Document or remove the pre-initialization `null` path state. `$path` is declared and documented as `Store<string>`, but `createRouterControls` initializes it through `$locationState.path` with `null as unknown as string`. Either model `string | null` publicly or initialize it to a real path; add a test for controls before `setHistory`.

- [ ] Decide which API-reference types are public and make the pages consistent with exports. The docs name `PathRoute`, `PathlessRoute`, `RouterControls`, `LocationState`, `To`, `Subscription`, and adapter options, but the package entry point exports only part of that surface. Export supported types and show importable names, or keep internal names out of public signatures.

### GitHub issues

- [ ] #28 Allow replace (not push) when trackQuery updates the query
- [ ] #30 Reset scroll on history change
- [ ] #31 Show error page when an effect fails on the page
- [ ] #34 RFC: Allow partial Route params updates
- [ ] #37 Support navigating to external URLs
- [ ] #40 trackQuery: read/write mapping for non-primitive query params
- [ ] #43 `route.$params` triggers whenever values of params actually not changed
- [ ] #56 [Bug]: routes never open without a fork scope - scopeBind throws inside openRoutesByPathFx and is silently swallowed
- [ ] #62 route.updated event with value-based deduplication
- [ ] #63 router.initialized and router.updated lifecycle events
- [ ] #64 routeNotFound option in createRouter
- [ ] #65 Custom query serializer for createRouterControls / createRouter
- [ ] #66 Standalone trackQuery / syncQuery operators, deprecate router.trackQuery method

## Контроль качества

### GitHub issues

- [ ] #35 Re-evaluate: prevent trackQuery from triggering unrelated chains

- [ ] Clarify the difference between a pathless `createRoute()` and `createVirtualRoute()`. `docs/core/index.md`, `docs/core/create-route.md`, and the core README present an unregistered pathless `createRoute()` as standalone modal/dialog state and call `open()` on it, but `createRoute().open()` only reaches `opened`/`$isOpened` through router registration and a history update. It also has no public `close`. Use `createVirtualRoute()` for standalone UI state, or explicitly document that a pathless `createRoute()` must be mapped to a router path.
