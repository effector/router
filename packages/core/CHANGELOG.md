# @effector/router

## 1.2.0

### Minor Changes

- [#82](https://github.com/effector/router/pull/82) [`4200e69`](https://github.com/effector/router/commit/4200e69f7ccd1971da3c38393936d3e76592cb4d) Thanks [@sergeysova](https://github.com/sergeysova)! - Add the composable pre-commit `beforeNavigate` and `redirect` operators, define
  pending/cancellation/concurrency for `chainRoute`, and ensure route preparation
  runs once per confirmed navigation. Lazy bindings now start dynamic imports at
  render time so React/Solid Suspense and Vue loading fallbacks are observable.

- [#82](https://github.com/effector/router/pull/82) [`f7a03cd`](https://github.com/effector/router/commit/f7a03cd4e10c32af2544b2a6cabe22681afbd6a4) Thanks [@sergeysova](https://github.com/sergeysova)! - Expose the current `trackQuery` evaluation through `$state`, including parsed
  parameters and pending route activation. Late-created trackers now derive the
  current scoped query state without an imperative check, and each evaluation
  parses the schema once.

### Patch Changes

- [#82](https://github.com/effector/router/pull/82) [`38ccf80`](https://github.com/effector/router/commit/38ccf804c3bd8c7ad9baa242b9b893e9eb4b065a) Thanks [@sergeysova](https://github.com/sergeysova)! - Extract route parameter names via `@effector/router-paths` `getParamNames` /
  `getRequiredParamNames` instead of hand-rolled regexes in core `createRoute` and
  React Native screen-name validation, keeping path-grammar knowledge in one
  place. `@effector/router-react-native` now declares `@effector/router-paths` as
  a dependency.

- [#82](https://github.com/effector/router/pull/82) [`9b0404f`](https://github.com/effector/router/commit/9b0404f24ca8581b884ec55a9375209dfcfcc9cb) Thanks [@sergeysova](https://github.com/sergeysova)! - Add executable core examples for controls ownership, nested routes, not-found,
  query tracking, and adapter initialization.

- [#82](https://github.com/effector/router/pull/82) [`8798ff4`](https://github.com/effector/router/commit/8798ff487f68f364864d7d5c7b907ce31d9e828b) Thanks [@sergeysova](https://github.com/sergeysova)! - Align core exports and declarations with the standalone query tracker public
  surface and remove obsolete tracker methods.

- [#82](https://github.com/effector/router/pull/82) [`a72f373`](https://github.com/effector/router/commit/a72f3739eb0b9dc1aa83d38dc10a1d8d94dcb808) Thanks [@sergeysova](https://github.com/sergeysova)! - Make route-filtered `trackQuery` react to explicit route readiness instead of
  an artificial microtask delay. Route switches no longer emit transient tracker
  states while the selected target is pending, including mapped pathless routes.

- [#82](https://github.com/effector/router/pull/82) [`eda3d34`](https://github.com/effector/router/commit/eda3d3426ce3d95a85f9fc3d640ca25b30b3e7b0) Thanks [@sergeysova](https://github.com/sergeysova)! - Make `createRoute()` without a path activate as a self-contained virtual route
  without router registration or history writes.

- [#82](https://github.com/effector/router/pull/82) [`0c4e2bd`](https://github.com/effector/router/commit/0c4e2bd35430d565f8183b81e0ef70c815ffe282) Thanks [@sergeysova](https://github.com/sergeysova)! - Add automated checks for documentation links, JSDoc references, sidebar entries, and orphaned API pages.

- [#82](https://github.com/effector/router/pull/82) [`f2af6b4`](https://github.com/effector/router/commit/f2af6b4f52065ef60a1d8b5a5ded486e868cbb55) Thanks [@sergeysova](https://github.com/sergeysova)! - Add a repeatable typecheck pipeline for public documentation snippets and expected API errors.

- [#82](https://github.com/effector/router/pull/82) [`d013248`](https://github.com/effector/router/commit/d013248fe72ad61ad0fbb2166ee34dc658debeed) Thanks [@sergeysova](https://github.com/sergeysova)! - Centralize route matching so activation, active-route state, stale closing, and
  dynamic registrations consume one match result.

- [#82](https://github.com/effector/router/pull/82) [`b986fc3`](https://github.com/effector/router/commit/b986fc3e86f0d93310d43f320a4c188109e9075b) Thanks [@sergeysova](https://github.com/sergeysova)! - Document and test the accepted navigation lifecycle compatibility matrix.

- [#82](https://github.com/effector/router/pull/82) [`fd3d1c2`](https://github.com/effector/router/commit/fd3d1c260330f2c3f640c85bfd29d10d7d15ba34) Thanks [@sergeysova](https://github.com/sergeysova)! - Keep history and query adapter locations live after programmatic and native
  history changes.

- [#82](https://github.com/effector/router/pull/82) [`e1a3985`](https://github.com/effector/router/commit/e1a3985b6db6934f06ea26ac4e79182385e8dc06) Thanks [@sergeysova](https://github.com/sergeysova)! - Expose `navigationFailed` on Router and controls for synchronous pre-init
  navigation failures without creating attempts or throwing errors.

- [#82](https://github.com/effector/router/pull/82) [`ba7ef23`](https://github.com/effector/router/commit/ba7ef2382c3f5ea3e115aeb6c56ff5f09b840511) Thanks [@sergeysova](https://github.com/sergeysova)! - Propagate nested router not-found handling to the nearest available ancestor.

- [#82](https://github.com/effector/router/pull/82) [`30cfeb0`](https://github.com/effector/router/commit/30cfeb07b61e6e9a9fc55eae96ac516d9583544d) Thanks [@sergeysova](https://github.com/sergeysova)! - Normalize equivalent empty open payloads and keep parameterized opens
  independent from previous route state.

- [#82](https://github.com/effector/router/pull/82) [`474bcc5`](https://github.com/effector/router/commit/474bcc5dd2cb6dea54d5b7f04c2e8e94c9ad7d67) Thanks [@sergeysova](https://github.com/sergeysova)! - Normalize pathless and path route lifecycle types, expose `close`, and make
  `updated` carry the same route-opened payload shape across route forms.

- [#82](https://github.com/effector/router/pull/82) [`4bcdba8`](https://github.com/effector/router/commit/4bcdba83463709f0e62be07a02b3b094ed51bc49) Thanks [@sergeysova](https://github.com/sergeysova)! - Add regression coverage for base, nested, query-only, dynamic, and Fork-scoped
  not-found behavior.

- [#82](https://github.com/effector/router/pull/82) [`88ed1e0`](https://github.com/effector/router/commit/88ed1e0c6f381bdd887b5f53c38cd153452cade5) Thanks [@sergeysova](https://github.com/sergeysova)! - Expose a nullable pre-initialization router path and reload adapter state while
  cleanly replacing previous history subscriptions.

- [#82](https://github.com/effector/router/pull/82) [`4a03bd0`](https://github.com/effector/router/commit/4a03bd0557969640f68708970a60cab78936fd8d) Thanks [@sergeysova](https://github.com/sergeysova)! - Compose parent and child route params at runtime and reject duplicate path
  parameter names with type and runtime diagnostics.

- [#82](https://github.com/effector/router/pull/82) [`fc36192`](https://github.com/effector/router/commit/fc36192cffbad1b32087562b072404716895b6b8) Thanks [@sergeysova](https://github.com/sergeysova)! - Keep a parent route open while switching between its child routes. The router's
  close pass treated a nested URL (e.g. `/profile/friends`) as not matching the
  parent pattern (`/profile`) and closed the parent, which its child immediately
  re-opened — making `parent.$isOpened` flicker `false→true`. Ancestors of matched
  routes are now preserved, so the parent stays open and bindings do not unmount
  and remount the parent view.

- [#82](https://github.com/effector/router/pull/82) [`fd3937f`](https://github.com/effector/router/commit/fd3937fe3812ea60de869b14bef2e7cd822de765) Thanks [@sergeysova](https://github.com/sergeysova)! - Resolve omitted pathname, search, and hash fields in history and query adapter
  navigation targets from the current location.

- [#82](https://github.com/effector/router/pull/82) [`95d031a`](https://github.com/effector/router/commit/95d031ae4298c1ce9cf331b06afedabc0870cab6) Thanks [@sergeysova](https://github.com/sergeysova)! - Use the shared `createRoute()` pathless lifecycle for groups and chained routes,
  and migrate examples, fixtures, and binding tests away from the deprecated
  `createVirtualRoute` factory.

- [#82](https://github.com/effector/router/pull/82) [`2c8148a`](https://github.com/effector/router/commit/2c8148a9d72232d6bab9f4a8b0f0b825af71a6b4) Thanks [@sergeysova](https://github.com/sergeysova)! - Document and verify query-adapter ownership across keyed, whole-search, shared,
  and partial-target navigation modes.

- [#82](https://github.com/effector/router/pull/82) [`2672fb2`](https://github.com/effector/router/commit/2672fb26e2b25a5447b5afb56d8a5fb9cd2bec48) Thanks [@sergeysova](https://github.com/sergeysova)! - Centralize URL query encoding and expose QueryInput removal semantics across
  core and framework link types.

- [#82](https://github.com/effector/router/pull/82) [`9102583`](https://github.com/effector/router/commit/9102583bc370e32100e60a9fc37199504d6dfea2) Thanks [@sergeysova](https://github.com/sergeysova)! - Separate URL-compatible `trackQuery.enter` inputs from transformed schema
  outputs and export the related query input types.

- [#82](https://github.com/effector/router/pull/82) [`672f427`](https://github.com/effector/router/commit/672f4278a9bd0009b4bf82d8553f6842c90d0906) Thanks [@sergeysova](https://github.com/sergeysova)! - Complete query codec, navigation, tracker, and adapter regression coverage.

- [#82](https://github.com/effector/router/pull/82) [`18805d8`](https://github.com/effector/router/commit/18805d85ce0f2a3db012fd387c3b7b453820014d) Thanks [@sergeysova](https://github.com/sergeysova)! - Align query replacement, preservation, and clearing semantics across navigation,
  route opens, redirects, and framework link hrefs.

- [#82](https://github.com/effector/router/pull/82) [`a502d68`](https://github.com/effector/router/commit/a502d68b3bbe894bbd14ad9a2314e69436af125a) Thanks [@sergeysova](https://github.com/sergeysova)! - Preserve unrelated query keys during `trackQuery` exit and apply schema-key
  ownership consistently to enter and exit.

- [#82](https://github.com/effector/router/pull/82) [`5d244fd`](https://github.com/effector/router/commit/5d244fd5d71a01320e75a0c8b70cd421e2999dbf) Thanks [@sergeysova](https://github.com/sergeysova)! - Fix route parameter parsing and updates, and preserve route-view metadata across
  web bindings. Links now expose query parameters in their rendered href, and
  Solid links can apply an `activeClass` while their route is open.

- [#82](https://github.com/effector/router/pull/82) [`9dc6c2f`](https://github.com/effector/router/commit/9dc6c2f4fbfc2d35d8ba9c6ce4a7619a7e82efe2) Thanks [@sergeysova](https://github.com/sergeysova)! - Add an optional root `notFound` route to `createRouter` for unknown locations.

- [#82](https://github.com/effector/router/pull/82) [`7983df2`](https://github.com/effector/router/commit/7983df2ae762f6a7bd9735c6b6b0cbca5ca00bd8) Thanks [@sergeysova](https://github.com/sergeysova)! - Type `createRoute(...).open` with the public `RouteOpenPayload` contract and
  remove the `@ts-expect-error` directives from `create-route.ts` production
  source. The normalizing `openFx` now accepts the public payload, the unified
  `opened` event is emitted from the existing `createAction` (dropping a
  tuple-clock `sample`), and the one genuinely unverifiable
  generic-versus-`any` return boundary is a single documented assertion. No
  runtime behavior change.

- [#82](https://github.com/effector/router/pull/82) [`5abb9da`](https://github.com/effector/router/commit/5abb9dafc8f0f937cfda1d3d168335855324d966) Thanks [@sergeysova](https://github.com/sergeysova)! - Add regression coverage for the unified path/pathless route contract, nested
  parents, SSR/Fork behavior, deprecated virtual routes, and history isolation.

- [#82](https://github.com/effector/router/pull/82) [`b01c71e`](https://github.com/effector/router/commit/b01c71e7345fb15de67ca8fbe7fab3527b55acc8) Thanks [@sergeysova](https://github.com/sergeysova)! - Make `route.updated` value-aware, suppressing first activation and equal,
  query-only, or close changes while preserving array order and key presence.

- [#82](https://github.com/effector/router/pull/82) [`fb708b9`](https://github.com/effector/router/commit/fb708b9d62318cc544bd2c23c6bee2fe7250f1b1) Thanks [@sergeysova](https://github.com/sergeysova)! - Expose `RouteUpdatedPayload` and use it for `PathlessRoute.updated`.

- [#82](https://github.com/effector/router/pull/82) [`bc30897`](https://github.com/effector/router/commit/bc308972567f4d1081653e0dc93cf9e9ada5d49a) Thanks [@sergeysova](https://github.com/sergeysova)! - Expose normalized `initialized` and `updated` router lifecycle events with
  equal-snapshot and hash-only suppression.

- [#82](https://github.com/effector/router/pull/82) [`4158b70`](https://github.com/effector/router/commit/4158b701dff777a3f61c7ea418ea7f69c341e293) Thanks [@sergeysova](https://github.com/sergeysova)! - Add lifecycle regression coverage for repeated initialization, native POP,
  stale-listener cleanup, Fork isolation, and normalized adapter targets.

- [#82](https://github.com/effector/router/pull/82) [`136a1f0`](https://github.com/effector/router/commit/136a1f06cf4bb4a0c06d039a4536433168056b39) Thanks [@sergeysova](https://github.com/sergeysova)! - Coordinate built-in adapters that share one History instance so commands commit
  once and native transitions retry only after every adapter proceeds.

- [#82](https://github.com/effector/router/pull/82) [`7e86724`](https://github.com/effector/router/commit/7e86724e53ba723fb0f9f4446ba2e2c982fbe54c) Thanks [@sergeysova](https://github.com/sergeysova)! - Add standalone `trackQuery({ controls, routes, parameters })` with automatic
  query and route activity tracking.

- [#82](https://github.com/effector/router/pull/82) [`d5e22b1`](https://github.com/effector/router/commit/d5e22b1b3e882461d472c7807ebf14c6c53652cf) Thanks [@sergeysova](https://github.com/sergeysova)! - Implement `createVirtualRoute` as a compatibility wrapper over the shared
  pathless route lifecycle while preserving its transformer and external pending
  store.
- Updated dependencies [[`9e98788`](https://github.com/effector/router/commit/9e98788609e3a36c4685322d58ceafea1aa1c447), [`1b98a47`](https://github.com/effector/router/commit/1b98a4773224fed2a1d511b3277d7bed86fb9267), [`4a03bd0`](https://github.com/effector/router/commit/4a03bd0557969640f68708970a60cab78936fd8d), [`709bca0`](https://github.com/effector/router/commit/709bca0e05efc9635d8bc58994998cc58c179694), [`51aa95d`](https://github.com/effector/router/commit/51aa95daf652461014016a071b881ae7980c93e5), [`38ccf80`](https://github.com/effector/router/commit/38ccf804c3bd8c7ad9baa242b9b893e9eb4b065a), [`5d244fd`](https://github.com/effector/router/commit/5d244fd5d71a01320e75a0c8b70cd421e2999dbf), [`3f0d4b3`](https://github.com/effector/router/commit/3f0d4b3efd1141198eae8acfba2f0d35ab32febe), [`d39555a`](https://github.com/effector/router/commit/d39555acaef132a04b4b3b286a2ee9c0f2625c98), [`cdb47e1`](https://github.com/effector/router/commit/cdb47e103cfb281f557b1ceb693c84ac43c37d8c)]:
  - @effector/router-paths@1.1.0

## 1.1.1

### Patch Changes

- [#58](https://github.com/effector/router/pull/58) [`0145f29`](https://github.com/effector/router/commit/0145f29a16f73c4537a490da52816ea935061ab3) Thanks [@sergeysova](https://github.com/sergeysova)! - Close previously matched routes before opening newly matched routes during path changes.

## 1.1.0

### Minor Changes

- [#16](https://github.com/effector/router/pull/16) [`591c462`](https://github.com/effector/router/commit/591c462c25ab81bf3b706e14982e91cc7b778bc3) Thanks [@sergeysova](https://github.com/sergeysova)! - Add an optional named query key mode to `queryAdapter`: `queryAdapter(history, { key })`.

  Instead of owning the whole `location.search`, the nested route is stored in a single named query parameter (e.g. `?modal=%2Fuser%2F1`), preserving all other query parameters on the host URL. This lets a query router coexist with the host app or with other `queryAdapter` routers (`?modal=…&tab=…`). Without options the behavior is unchanged (whole-search mode).

### Patch Changes

- [#10](https://github.com/effector/router/pull/10) [`de48b5a`](https://github.com/effector/router/commit/de48b5a3524a7c407613b1ef6051be1fff52e1c5) Thanks [@mollehxh](https://github.com/mollehxh)! - Fix `queryAdapter` crashing on relative paths and empty `location.search` by using `history` path helpers (`parsePath`/`createPath`) instead of `new URL(...)`. Fixes [#7](https://github.com/effector/router/issues/7).

- [#16](https://github.com/effector/router/pull/16) [`591c462`](https://github.com/effector/router/commit/591c462c25ab81bf3b706e14982e91cc7b778bc3) Thanks [@sergeysova](https://github.com/sergeysova)! - Enforce the `queryAdapter` `To` contract: a string target is treated as a full path (`pathname[?search][#hash]`, following the `history` convention), identical to its object form. Fixes an inconsistency where an empty object target (`push({})`) wrote a stray `?%2F` while `push('')` cleared the search — both now clear it.

- [#17](https://github.com/effector/router/pull/17) [`16c5d32`](https://github.com/effector/router/commit/16c5d32a605ecbcfda59e178dd0fbd34d8c9e57a) Thanks [@sergeysova](https://github.com/sergeysova)! - Harden published package manifests: add a `types` condition to each `exports`
  subpath (so `node16`/`nodenext` consumers resolve declarations) and a top-level
  `main` for legacy CJS tooling, and widen internal dependencies from `workspace:*`
  to `workspace:^` so consumers get caret ranges instead of exact pins.
- Updated dependencies [[`16c5d32`](https://github.com/effector/router/commit/16c5d32a605ecbcfda59e178dd0fbd34d8c9e57a)]:
  - @effector/router-paths@1.0.1

## 1.0.0

### Patch Changes

- ee7525a: fix(router): .opened can't trigger .open
- 5e609e8: chore: set new patch version
- Updated dependencies [5e609e8]
  - @effector/router-paths@1.0.0
