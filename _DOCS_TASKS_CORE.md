# Core documentation tasks

Audit scope: `packages/core/README.md`, every page in `docs/core/`, the core-related getting-started material, all files in `packages/core/lib/`, and all core tests. The core suite passes (48 tests) after building the local `@effector/router-paths` dependency.

## Актуализация документации

- [ ] Fix the getting-started history initialization example. `docs/introduction/getting-started.md` passes `createBrowserHistory()` directly to `router.setHistory`, while the public event accepts a `RouterAdapter`; wrap the history with `historyAdapter(...)` and import it. Add a documentation typecheck/example test so this cannot regress.

- [ ] Document whether `navigate.query` replaces or merges the current query. The controls guide says to add/update query parameters, but `createRouterControls` serializes the supplied object as the complete search string. Examples that navigate first with `{ page }` and then `{ filter }` therefore lose `page`. State the replacement behavior or implement merging, and add a regression test.

- [ ] Use one accurate `Query` type everywhere. `docs/core/create-router-controls.md` documents `Record<string, string | string[] | undefined>`, while the exported type is `Record<string, string | null | Array<string | null>>`. Core JSDoc/examples also use numeric arrays (`[1, 2]`) that the public type rejects. Update all signatures and examples together.

- [ ] Replace the obsolete `controls.trackQuery('q', { defaultValue })` example. The implementation only accepts `{ parameters: ZodType, check? }`; use the Zod-based API shown on the dedicated `trackQuery` page and document the optional `check` field in the config table.

- [ ] Correct `trackQuery` lifecycle and removal semantics. The guide describes `entered` as a transition when parameters appear, but the implementation/test suite emits it again for every valid query change. `exit()` clears the entire query, not only the schema's keys, unless `ignoreParams` explicitly lists keys to preserve. Document these behaviors or change the implementation, with tests for unrelated query parameters.

- [ ] Fix non-compiling `chainRoute` examples. `createRoute<{ userId: string }>({ path: '/user/:userId' })` supplies an object where the first generic is the path string; rely on path inference instead. The `loadUserDataFx.doneData` example also treats the returned data as an Effector `done` payload and reads `.result`, although `doneData` already is the result.

- [ ] Correct the `group` API and examples. The implementation accepts both `Route` and `VirtualRoute`, but the documented signature only accepts `Route[]`. Conversely, the basic example calls `.close()` on `createRoute` results even though `close` is not public. Demonstrate closure through router navigation for normal routes, or use virtual routes in the manual-close example.

- [ ] Repair the custom-adapter examples in `docs/core/adapters.md`. Several adapters treat a string `To` as a pathname even though the same page defines it as a full `pathname?search#hash` value. The React Native and Electron `replace` examples call `this.push` from arrow functions, and the location-maintenance example assigns `this.location` from an arrow function; these snippets are not valid implementations. Factor a shared local `navigate`/`updateLocation` function and parse string targets consistently.

- [ ] Correct the custom adapter in `docs/core/create-router-controls.md`: its `location` object omits the required `hash`, so it does not satisfy `RouterAdapter`. Prefer a typed example (`satisfies RouterAdapter`) to keep the docs honest.

### GitHub issues

- [ ] #23 Docs: nested routes with params propagation
- [ ] #24 Docs: mapping trackQuery result into a store
- [ ] #25 Docs: observing route navigation and applied params

## Модификация поведения

- [ ] Remove or implement `beforeOpen` for `createVirtualRoute`. `docs/core/create-virtual-route.md` lists `options.beforeOpen` and contains working-looking examples, but `VirtualRouteOptions` only supports `$isPending` and `transformer`, and the implementation never runs effects. Cover the chosen contract with a test.

- [ ] Make nested-route parameter documentation match the type/runtime contract. `docs/core/create-route.md` says a child with `path: '/posts'` and parent `'/profile/:userId'` can be opened with `{ params: { userId } }`, but `createRoute` infers params only from the child's own path. Either include parent params in the child route type or rewrite the guide around the actual supported pattern; add a type/runtime test where the parameter exists only on the parent.

- [ ] Align `NavigatePayload` across docs, declarations, and examples. Both `docs/core/create-router.md` and `docs/core/create-router-controls.md` mark `query` optional and show `navigate({ path })`, while `packages/core/lib/types.ts` requires `query`. Decide whether navigation may omit query; then update the public type, examples, and the two empty navigation tests in `router.test.ts`.

- [ ] Resolve the adapter `location` contract inconsistency. The guide requires `adapter.location` to stay synchronized and says omitted object fields have common fallbacks, but both built-in adapters expose an initial snapshot, and `historyAdapter` delegates partial-object behavior to `history` while `queryAdapter` supplies its own `/`/empty fallbacks. Define the intended contract, update implementation/docs, and test partial targets plus `adapter.location` after navigation.

- [ ] Document or remove the pre-initialization `null` path state. `$path` is declared and documented as `Store<string>`, but `createRouterControls` initializes it through `$locationState.path` with `null as unknown as string`. Either model `string | null` publicly or initialize it to a real path; add a test for controls before `setHistory`.

- [ ] Decide which API-reference types are public and make the pages consistent with exports. The docs name `PathRoute`, `PathlessRoute`, `RouterControls`, `LocationState`, `To`, `Subscription`, and adapter options, but the package entry point exports only part of that surface. Export supported types and show importable names, or keep internal names out of public signatures.

### GitHub issues

- [ ] #26 Expose pending state for chained routes
- [ ] #28 Allow replace (not push) when trackQuery updates the query
- [ ] #30 Reset scroll on history change
- [ ] #31 Show error page when an effect fails on the page
- [ ] #32 RFC: chainRoute API naming & composition (vs createVirtualRoute)
- [ ] #34 RFC: Allow partial Route params updates
- [ ] #37 Support navigating to external URLs
- [ ] #39 RFC: block or confirm route transitions
- [ ] #40 trackQuery: read/write mapping for non-primitive query params
- [ ] #42 RFC: add `createTask` helper for `chainRoute`
- [ ] #43 `route.$params` triggers whenever values of params actually not changed
- [ ] #53 [Bug]: beforeOpen is called twice during link navigation
- [ ] #56 [Bug]: routes never open without a fork scope - scopeBind throws inside openRoutesByPathFx and is silently swallowed
- [ ] #57 [Feature]: Shared layout mechanism to prevent redundant re-renders
- [ ] #61 redirect operator
- [ ] #62 route.updated event with value-based deduplication
- [ ] #63 router.initialized and router.updated lifecycle events
- [ ] #64 routeNotFound option in createRouter
- [ ] #65 Custom query serializer for createRouterControls / createRouter
- [ ] #66 Standalone trackQuery / syncQuery operators, deprecate router.trackQuery method

## Контроль качества

### GitHub issues

- [ ] #35 Re-evaluate: prevent trackQuery from triggering unrelated chains

- [ ] Clarify the difference between a pathless `createRoute()` and `createVirtualRoute()`. `docs/core/index.md`, `docs/core/create-route.md`, and the core README present an unregistered pathless `createRoute()` as standalone modal/dialog state and call `open()` on it, but `createRoute().open()` only reaches `opened`/`$isOpened` through router registration and a history update. It also has no public `close`. Use `createVirtualRoute()` for standalone UI state, or explicitly document that a pathless `createRoute()` must be mapped to a router path.
