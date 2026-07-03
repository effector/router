# @effector/router-react

## 1.0.1

### Patch Changes

- [#17](https://github.com/effector/router/pull/17) [`16c5d32`](https://github.com/effector/router/commit/16c5d32a605ecbcfda59e178dd0fbd34d8c9e57a) Thanks [@sergeysova](https://github.com/sergeysova)! - Harden published package manifests: add a `types` condition to each `exports`
  subpath (so `node16`/`nodenext` consumers resolve declarations) and a top-level
  `main` for legacy CJS tooling, and widen internal dependencies from `workspace:*`
  to `workspace:^` so consumers get caret ranges instead of exact pins.
- Updated dependencies [[`591c462`](https://github.com/effector/router/commit/591c462c25ab81bf3b706e14982e91cc7b778bc3), [`556c1c6`](https://github.com/effector/router/commit/556c1c62427fba298760d517a2cab314d1f06a05), [`591c462`](https://github.com/effector/router/commit/591c462c25ab81bf3b706e14982e91cc7b778bc3), [`16c5d32`](https://github.com/effector/router/commit/16c5d32a605ecbcfda59e178dd0fbd34d8c9e57a)]:
  - @effector/router@1.1.0

## 1.0.0

### Patch Changes

- 5e609e8: chore: set new patch version
- Updated dependencies [ee7525a]
- Updated dependencies [5e609e8]
  - @effector/router@1.0.0
