# Tasks

The single ordered backlog for implementing the accepted contracts from
[DECISIONS.md](DECISIONS.md). Follow
[IMPLEMENTATION_RULES.md](IMPLEMENTATION_RULES.md) for every task. Insert an
observable regression from [BUGS.md](BUGS.md) into the nearest applicable stage
before adding new behavior in that area.

The order below is dependency-driven. Execute stages and tasks from top to
bottom. Mark a completed task `[x]` only together with its runtime/type tests,
documentation, and changeset; keep the task text as an audit trail.

Decision rank: **D5 → D3 → D4.1–D4.3 → D4.4 → D1–D2 → D6 → D7–D8 → D9**.
Stages 6 and 10 are mandatory conformance gates between these contracts.

## 1. Path language foundation — D5

Stabilize `@effector/router-paths` first. Route param inference, URL building,
matching, nested params, and RN screen names depend on it.

- [x] **T01 — Optional params.** Produce a genuinely optional type shape
      (`{ id?: string }`, not a required key containing `undefined`). Omit an
      absent key from the runtime parse result. Cover ordinary, generic,
      embedded (`/@:user`, `/name-:user`), and array params.
- [x] **T02 — Shared cardinality.** Apply identical `min`/`max` rules in parser
      and builder for `+`, `*`, `{min,max}`, and their combinations with `?`.
      The builder throws a descriptive error; the parser returns `null`.
- [x] **T03 — Runtime validation of generic values.** Validate builder input for
      `number`, literal unions, and arrays using the same constraints as the
      parser. Do not build a URL that the same compiled pattern cannot parse.
- [x] **T04 — Pathname patterns only.** Add aligned runtime and type-level
      diagnostics for query, hash, origin/full URL, invalid ranges, unclosed
      generic/range syntax, and conflicting modifiers. Do not add base, origin,
      or query configuration to the paths package.
- [x] **T05 — Paths conformance matrix.** Move compile-time assertions out of
      production types and into test fixtures. Cover parse/build round trips,
      bounds, optional omission, embedded params, malformed/adversarial input,
      and full-URL rejection. Then update the package README, docs, and
      changeset.

## 2. Unified Route model — D3

This stage depends on D5 and creates the common route payload/lifecycle used by
Router, query operators, and all bindings.

- [x] **T06 — Normalize public route types.** Reconcile `PathRoute`,
      `VirtualRoute`/`PathlessRoute`, `RouteOpenedPayload`, `open`, `close`,
      `opened`, `updated`, `closed`, `$params`, `$isOpened`, and `$isPending`
      into one consistent contract. Retain compatible deprecated exports for
      the current major.
- [x] **T07 — Implement both `createRoute` forms.** `createRoute({ path })`
      creates a URL route. `createRoute<Params>()` without a path creates a
      self-contained virtual route that does not require Router registration
      and never writes history.
- [x] **T08 — Deprecated alias without an early removal.** Implement
      `createVirtualRoute` as a deprecated compatibility wrapper over the shared
      `createRoute()` lifecycle. Preserve its current generic overloads,
      `transformer`, and external `$isPending` through the current major. Add
      type/runtime tests and migration examples using `createRoute()` plus
      ordinary Effector composition.
- [x] **T09 — Normalize open payloads.** For a route without required params,
      types and runtime treat `open()`, `open({})`, and
      `open({ params: {} })` as equivalent. A route with required params accepts
      the complete set and never merges missing values from current state.
- [x] **T10 — Parent params intersection.** Child `$params`, `open`, Link, and
      builders use the combined parent/child params; the parent stores only its
      own path params. Reject duplicate param names in type validation and emit
      a runtime diagnostic for dynamic string patterns.
- [x] **T11 — Value equality and `route.updated`.** Compare params independent
      of object key order, while preserving array order and the distinction
      between `null` and absence. First activation emits only `opened`. A
      value-different update to an open route emits one `updated` with the
      complete `RouteOpenedPayload<T>`. Same-value, query-only, and close
      operations do not emit it.

- [x] **T09 — Normalize open payloads.** For a route without required params,
      types and runtime treat `open()`, `open({})`, and
      `open({ params: {} })` as equivalent. A route with required params accepts
      the complete set and never merges missing values from current state.
- [x] **T12 — Route regression/type matrix.** Cover path and virtual routes,
      payload overloads, the deprecated alias, parent chains deeper than one
      level, conflicting params, replacement updates, SSR/client events, Fork
      API/global scope, and absence of history effects for virtual routes. Update
      exports, core reference, README, and changeset.

## 3. Adapter and router lifecycle — D4.1–D4.3

After Route is stable, establish one location-state source of truth. Query
semantics, transition policy, and framework href builders depend on it.

- [x] **T13 — Live `RouterAdapter.location`.** Keep a complete synchronous
      `{ pathname, search, hash }` snapshot current after initial read, `push`,
      `replace`, listener updates, and native navigation. Do not retain the stale
      location object captured when the adapter was created.
- [x] **T14 — Partial navigation targets.** Normalize string and partial object
      targets so omitted `pathname`, `search`, and `hash` retain values from the
      current adapter location. Apply the same contract to historyAdapter and
      queryAdapter's internal location.
- [x] **T15 — Query adapter ownership.** Preserve the host pathname/hash and
      unrelated query keys while updating only the nested route owned by the
      adapter. Cover keyed and whole-search modes, multiple query adapters, a
      shared historyAdapter, and partial nested targets.
- [x] **T16 — State before and after `setHistory`.** Change `$path` to
      `Store<string | null>`, keep `$query = {}` before initialization, and load
      the initial snapshot atomically. A repeated `setHistory` unsubscribes old
      listen/block subscriptions before connecting the new adapter.
- [x] **T17 — Observable pre-init command failure.** Add the shared public
      `navigationFailed: Event<NavigationFailure>` unit to Router and controls.
      Reject `navigate`, `back`, and `forward` synchronously before creating a
      navigation attempt when history is not initialized. Cover the exact
      discriminated payload, direct and route-originated navigation, absence of
      throws/console output/queues, unchanged history and route state, virtual
      routes, global scope, and Fork API isolation.
- [x] **T18 — Router lifecycle events.** Add public `initialized` and
      `updated: Event<LocationState>`. `initialized` fires after every successful
      `setHistory`; `updated` fires only after a later value change to path or
      query. An equal snapshot or hash-only change produces neither an event nor
      a store update.
- [x] **T19 — Lifecycle matrix and reference.** Cover string/partial round trips,
      repeated initialization, stale-adapter isolation, same-value suppression,
      hash-only changes, native POP, global scope/Fork API, and cleanup. Update
      public exports, adapter/core docs, README, and changeset.

## 4. Router matching and not-found propagation — D4.4

Build matching after the location lifecycle but before query trackers and
RouteView. Both layers must observe the final active route tree.

- [ ] **T20 — Explicit match result.** Centralize matched-route calculation for
      root and nested routers so activation, `$activeRoutes`, stale-route close,
      and not-found consume one result, including dynamic `registerRoute` calls.
- [ ] **T21 — Root `notFound`.** Add an optional virtual `notFound` to
      `createRouter`. Open it only when no route matches and close it when a known
      URL is restored. Without a fallback, an unknown URL activates no special
      route.
- [ ] **T22 — Nested propagation.** Give a nested `notFound` priority in its
      subtree and propagate a missing match to the nearest ancestor fallback when
      no local fallback exists. Cover an unknown remainder below a matched parent
      or base. Never open local and ancestor fallbacks together.
- [ ] **T23 — Not-found matrix.** Cover root/nested/base routers, multiple
      fallback levels, no fallback, unknown → known → unknown transitions,
      query-only changes, repeated route registration, and Fork API. Update the
      core reference, examples, and changeset.

## 5. Query navigation and tracking — D1–D2

Implement query after D4 so the operator depends only on controls and a stable
location snapshot, not on a configured Router instance.

- [ ] **T24 — One Query codec.** Centralize parsing/stringifying for
      `Query = Record<string, string | null | Array<string | null>>`:
      `undefined` removes a key, `null` encodes a flag, and arrays use repeated
      keys. Preserve array value order and use value equality.
- [ ] **T25 — Complete `navigate({ query })` semantics.** An omitted `query`
      preserves the current query, a provided object fully replaces it, and `{}`
      clears it. Apply the same effective-URL semantics to `route.open`, redirect,
      and href builders so native and intercepted navigation agree.
- [ ] **T26 — Standalone `trackQuery`.** Export
      `trackQuery({ controls, routes?, parameters })`, rename `forRoutes` to
      `routes`, filter through `$isOpened` with OR semantics, and react without
      `check`. Remove `router.trackQuery`/`controls.trackQuery` methods and provide
      migration documentation.
- [ ] **T27 — Separate URL input from schema output.** `entered` publishes
      `z.output<ParametersSchema>`. `enter` accepts only schema-owned keys with
      `string | null | Array<string | null>` values. Numbers, dates, booleans,
      and objects are converted externally before `enter`. Export a Query value
      type, remove production `@ts-expect-error`, and cover both sides with
      positive and negative type fixtures.
- [ ] **T28 — `enter`/`exit` ownership.** Preserve unrelated query keys during
      partial enter/exit. Correctly handle `ignoreParams`, route activation and
      deactivation, same-value changes, and later re-entry into the schema.
- [ ] **T29 — Query matrix.** Cover flags, repeated keys, empty arrays, encoding,
      path-only navigation, explicit clear, trackers without routes, OR across
      routes, transformed schemas, enter/exit, and adapter round trips. Update the
      core API reference, examples, README, and changeset.

## 6. Core API conformance checkpoint

Do not migrate bindings until public core types are stable.

- [ ] **T30 — Verify the public surface.** Compare
      `packages/core/lib/index.ts`, generated declarations, package README, and
      docs against D1–D5. Remove stale types, methods, and examples; export the
      new payloads, events, and operators.
- [ ] **T31 — Executable core examples.** Move essential snippets into compile
      or runtime fixtures: FSD controls ownership, path/virtual routes, nested
      params, notFound, query tracking, and adapter initialization.
- [ ] **T32 — Lifecycle compatibility gate.** Re-run and, where required,
      extend the regression suite for the accepted
      [Navigation lifecycle RFC](NAVIGATION_LIFECYCLE_RFC.md): one preparation
      per logical transition, pending boundaries, cancellation/error, redirect
      loops, native POP, and takeLatest chainRoute. D1–D5 implementation must not
      change the public lifecycle model.

## 7. Recursive RouteView tree and layouts — D6

Update the RouteView contract across all web bindings in one stage so React,
Solid, and Vue do not acquire incompatible trees.

- [ ] **T33 — Binding-private layout group identity.** Each call to the existing
      `withLayout(Layout, views)` creates a unique group token and retains the
      token and Layout in private metadata on every transformed view. The
      renderer keeps the wrapper stable while selected views share a token and
      replaces only the page child. Do not export this metadata from core or add
      a new public operator. Two calls with the same Layout receive different
      tokens.
- [ ] **T34 — One selection algorithm.** In every binding, select active views,
      remove a parent whose child is active, choose the last declared active
      sibling, and delegate `route: Router` to its nested renderer. Do not store
      open-order UI state.
- [ ] **T35 — Recursive `Outlet`.** React, Solid, and Vue provide the selected
      view's children through context at every level. Cover at least three
      levels, sibling switches, a nested Router, and no active child. The parent
      view remains mounted when its child changes.
- [ ] **T36 — Persistent `withLayout` (#57).** Preserve one layout instance
      during transitions within a group; unmount it on exit. Distinguish separate
      groups that use the same component and support nested/lazy views. Preserve
      `route`, `children`, and all other metadata during transformation.
- [ ] **T37 — Lazy/eager parity.** Verify one recursive `children` contract, an
      importer that starts only on render, an observable React/Solid Suspense or
      Vue loading fallback, and absence of recursive `route.open()` or core
      preload hooks.
- [ ] **T38 — RouteView matrix and docs.** Add equivalent parent/child,
      router-target, virtual/pathless, priority, layout mount-count, and lazy
      tests for React, Solid, and Vue. Synchronize types, `useOpenedViews`
      examples, package READMEs, docs, and changesets for all three bindings.

## 8. Web Link and `useLink` parity — D7–D8

This stage depends on final route payloads (D3) and query policy (D1–D2).

- [ ] **T39 — One effective href contract.** React, Solid, and Vue build href
      from the complete path params and effective query: an explicit query
      replaces current query, while omission follows D1. A native anchor and
      `route.open` reach the same URL.
- [ ] **T40 — Native click policy.** Intercept only an ordinary primary-button,
      same-origin `_self` click. Preserve user `preventDefault`, modified clicks,
      `target != _self`, download/native attributes, and normal browser behavior.
      Pass `replace`, params, and query consistently.
- [ ] **T41 — React Link.** Add runtime and type coverage for conditional params,
      current/explicit/empty query, modified/secondary clicks, `_blank`,
      cancellation, refs, and anchor attributes. Update D7 docs and README.
- [ ] **T42 — Solid Link/useLink.** Cover direct `useLink`, reactive params and
      query, activeClass policy, the native click matrix, and conditional params.
      Keep shared documentation aligned with React and Vue.
- [ ] **T43 — Vue Link.** Verify exported generic `LinkProps<Params>`,
      conditionally required params in TypeScript usage, and document template
      inference limits. Cover query, replace, target, modifiers, cancellation,
      attributes, and event forwarding. Do not introduce a `createLink` factory.
- [ ] **T44 — Binding release slice.** Run the shared cross-binding Link matrix,
      update package READMEs/docs, and add changesets for React, Solid, and Vue.

## 9. React Native integration — D9

RN is the final binding stage because it depends on final route identity, nested
params, the active Router tree, and navigation semantics.

- [ ] **T45 — App-owned RN ref bridge.** Make `createStackNavigator` and
      `createBottomTabsNavigator` return `NativeNavigator` components directly.
      Require the app-owned `navigationRef` component prop; do not create a
      container, Router, history adapter, callback pair, or public intent unit.
      Subscribe to native `ready`/`state`, handle an already-ready ref, read a
      complete state snapshot, establish the readiness gate used by later
      synchronization, bind callbacks to the rendered Effector scope, and remove
      ref/Effector subscriptions on unmount. Add public type fixtures and focused
      lifecycle tests.
- [ ] **T46 — Navigator option types.** Add RN-specific RouteView `options`.
      Pass navigator `screenOptions` and per-screen `options` through as native
      object/callback values without manually merging them. Stack and Tabs retain
      their distinct native option types.
- [ ] **T47 — Stable screen names.** Derive a name from the complete registered
      path template, including parent and base segments, without an index
      fallback. Validate `initialRouteName` only for routes without required
      params. Reject parameterized routes in Bottom Tabs.
- [ ] **T48 — Router as source of truth.** Implement Router-to-RN synchronization
      with params and push/replace intent. Before native readiness, retain only
      the latest Router snapshot and synchronize it when ready. Suppress echo
      loops from binding-owned updates and remove stale-state races during fast
      transitions and initialization.
- [ ] **T49 — Native intents.** Translate screen focus, native back/remove, a
      completed back gesture, and tab press into route/controls intent without
      mutating RN state directly inside the handler. Deep-link URL parsing and
      Linking configuration remain app-owned. Normalize only the public ref and
      screen-listener notifications defined by D9.1; do not use
      `__unsafe_action__` or export a native-intent unit. Verify unsubscribe and
      Fork API scope binding for callbacks.
- [ ] **T50 — Real RN integration suite.** Render the component shape with an
      app-owned `NavigationContainer`. Cover direct return, complete names,
      params, initial-route restrictions, tabs, option callbacks, push/replace,
      back/gesture/tab intent, echo suppression, races, scopes, and cleanup.
- [ ] **T51 — RN documentation boundary.** Add an adapter/initialization recipe.
      Remove claims about persistence, time travel, deep links, or gestures until
      the corresponding scenario has an integration test. Update the package
      README, docs, and changeset.

## 10. Documentation conformance and final QA

This stage closes the series, but each earlier stage must ship its own docs and
changesets rather than deferring them here.

- [ ] **T52 — Typecheck documentation snippets.** Add a pipeline for extracted
      or imported public-API snippets. Separately verify expected compile errors
      for params, paths, Link, and RN restrictions.
- [ ] **T53 — Validate source and sidebar links.** Automate checks for source
      `@link` references, internal Markdown links, VitePress sidebar entries, and
      missing or orphaned public-API pages.
- [ ] **T54 — Smoke-test quick starts.** Create one reusable fixture for each
      published quick start: core, React, Solid, Vue, and RN. Docs include or
      reproduce the same verified code without an alternative pseudo-API. Every
      fixture builds and typechecks; fixtures with a renderer also open the
      initial route and perform one navigation.
- [ ] **T55 — Final docs/API audit.** Check package READMEs, docs pages, exports,
      and examples for every affected package. Separate application policy from
      core contract and remove legacy claims. Consolidate the accepted lifecycle
      contract and reusable rationale from `NAVIGATION_LIFECYCLE_RFC.md` into
      `docs/core/navigation-lifecycle.md` or a dedicated permanent article,
      update internal references, then delete the temporary root RFC.
- [ ] **T56 — Full release gate.** After each slice's package checks, run full
      build, typecheck, test, lint, docs build, and changeset status. When the
      gate is green, remove closed Txx items and linked Decisions according to
      `IMPLEMENTATION_RULES.md`; narrow partially completed items to their exact
      remaining behavior.
