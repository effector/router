# @effector/router

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
