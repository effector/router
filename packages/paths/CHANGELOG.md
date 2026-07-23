# @effector/router-paths

## 1.1.0

### Minor Changes

- Export `getParamNames(pattern)` and `getRequiredParamNames(pattern)`, derived
  from the path tokenizer. They are the single source of truth for extracting
  parameter names from a pattern, so consumers no longer re-implement the path
  grammar with ad-hoc regexes. ([#82](https://github.com/effector/router/pull/82) [`38ccf80`](https://github.com/effector/router/commit/38ccf804c3bd8c7ad9baa242b9b893e9eb4b065a))

### Patch Changes

- Validate repeated path modifiers without a nonlinear suffix regular expression. ([#82](https://github.com/effector/router/pull/82) [`9e98788`](https://github.com/effector/router/commit/9e98788609e3a36c4685322d58ceafea1aa1c447))

- Make optional path parameters optional object properties and omit absent
  parameters from parser results. ([#82](https://github.com/effector/router/pull/82) [`1b98a47`](https://github.com/effector/router/commit/1b98a4773224fed2a1d511b3277d7bed86fb9267))

- Compose parent and child route params at runtime and reject duplicate path
  parameter names with type and runtime diagnostics. ([#82](https://github.com/effector/router/pull/82) [`4a03bd0`](https://github.com/effector/router/commit/4a03bd0557969640f68708970a60cab78936fd8d))

- Reject non-pathname and malformed path patterns with aligned runtime and
  type-level diagnostics. ([#82](https://github.com/effector/router/pull/82) [`709bca0`](https://github.com/effector/router/commit/709bca0e05efc9635d8bc58994998cc58c179694))

- Move path type assertions into the test matrix and expand runtime conformance
  coverage for round-trips, malformed input, and pathname-only patterns. ([#82](https://github.com/effector/router/pull/82) [`51aa95d`](https://github.com/effector/router/commit/51aa95daf652461014016a071b881ae7980c93e5))

- Fix route parameter parsing and updates, and preserve route-view metadata across
  web bindings. Links now expose query parameters in their rendered href, and
  Solid links can apply an `activeClass` while their route is open. ([#82](https://github.com/effector/router/pull/82) [`5d244fd`](https://github.com/effector/router/commit/5d244fd5d71a01320e75a0c8b70cd421e2999dbf))

- Parse path patterns with one shared linear tokenizer in `compile` and
  `convertPath`. This avoids super-linear regular expression behavior and keeps
  embedded parameters such as `/@:user` and `/name-:user?` consistent between
  parsing, building, type inference, and Express conversion. ([#82](https://github.com/effector/router/pull/82) [`3f0d4b3`](https://github.com/effector/router/commit/3f0d4b3efd1141198eae8acfba2f0d35ab32febe))

- Apply the same cardinality bounds to path parsing and building, including
  optional repeated parameters. ([#82](https://github.com/effector/router/pull/82) [`d39555a`](https://github.com/effector/router/commit/d39555acaef132a04b4b3b286a2ee9c0f2625c98))

- Validate numeric, literal-union, and repeated path values before building URLs. ([#82](https://github.com/effector/router/pull/82) [`cdb47e1`](https://github.com/effector/router/commit/cdb47e103cfb281f557b1ceb693c84ac43c37d8c))

## 1.0.1

### Patch Changes

- Harden published package manifests: add a `types` condition to each `exports`
  subpath (so `node16`/`nodenext` consumers resolve declarations) and a top-level
  `main` for legacy CJS tooling, and widen internal dependencies from `workspace:*`
  to `workspace:^` so consumers get caret ranges instead of exact pins. ([#17](https://github.com/effector/router/pull/17) [`16c5d32`](https://github.com/effector/router/commit/16c5d32a605ecbcfda59e178dd0fbd34d8c9e57a))

## 1.0.0

### Patch Changes

- 5e609e8: chore: set new patch version
