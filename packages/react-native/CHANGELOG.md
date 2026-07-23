# @effector/router-react-native

## 1.1.0

### Minor Changes

- Re-export platform-neutral React bindings from the React Native package so
  applications do not need a separate React bindings import. Browser-only
  `Link`, `useLink`, and `LinkProps` remain available only from
  `@effector/router-react`; the core router API remains available from
  `@effector/router`. ([#82](https://github.com/effector/router/pull/82) [`0222882`](https://github.com/effector/router/commit/02228824db3d605842250d9a10911c025b53378c))

### Patch Changes

- Extract route parameter names via `@effector/router-paths` `getParamNames` /
  `getRequiredParamNames` instead of hand-rolled regexes in core `createRoute` and
  React Native screen-name validation, keeping path-grammar knowledge in one
  place. `@effector/router-react-native` now declares `@effector/router-paths` as
  a dependency. ([#82](https://github.com/effector/router/pull/82) [`38ccf80`](https://github.com/effector/router/commit/38ccf804c3bd8c7ad9baa242b9b893e9eb4b065a))

- Clarify the React Native adapter boundary and remove untested deep-link, persistence, time-travel, and gesture-flow claims from the documentation. ([#82](https://github.com/effector/router/pull/82) [`055e0e8`](https://github.com/effector/router/commit/055e0e81f75ad5d156153500589eccac64942198))

- Add a React Native integration harness covering direct navigator components,
  screen/options rendering, readiness races, params, tab intent, echo suppression,
  and cleanup. ([#82](https://github.com/effector/router/pull/82) [`9542fbd`](https://github.com/effector/router/commit/9542fbdeff31467984020207cf3b1a11968fc80d))

- Translate React Navigation focus, removal, closing gestures, and tab presses to
  scoped Router route units without exposing a native-intent API. ([#82](https://github.com/effector/router/pull/82) [`758692e`](https://github.com/effector/router/commit/758692e4aca840c4707eb9d63100d1057ce679ab))

- Add stack and bottom-tabs native RouteView option types and pass per-screen
  options through without manual merging. ([#82](https://github.com/effector/router/pull/82) [`27e15d2`](https://github.com/effector/router/commit/27e15d2b49e7f2c0214016f05b9a0f72a490b560))

- Return React Native navigators directly and connect them to an app-owned
  NavigationContainer ref with ready/state lifecycle cleanup. ([#82](https://github.com/effector/router/pull/82) [`5d1c4d5`](https://github.com/effector/router/commit/5d1c4d5e8099d66f7e13d6c41f47d1dd5ce64e0c))

- Gate Router-to-native synchronization on ref readiness, preserve params and
  replace intent, retain only the latest pre-ready target, and suppress matching
  native echoes. ([#82](https://github.com/effector/router/pull/82) [`e909dee`](https://github.com/effector/router/commit/e909dee42390d90bc7eef5ca7585437b9c41a7d6))

- Derive React Native screen names from complete parent path templates and reject
  unsupported parameterized initial routes and bottom-tab screens. ([#82](https://github.com/effector/router/pull/82) [`c53f769`](https://github.com/effector/router/commit/c53f769012295e412b072d71c19b726174801cb4))

- Keep React Navigation screen names equal to route paths so `initialRouteName`
  uses the same value as registered screens. Navigator `screenOptions` now also
  accept React Navigation's callback form without reapplying global options per
  screen. Nested route views are registered as navigator screens.
  Router transitions now target the navigation object provided by
  `NavigationContainer`.
  Native screen focus events now open their matching Effector routes. ([#82](https://github.com/effector/router/pull/82) [`c0ef37a`](https://github.com/effector/router/commit/c0ef37acfd2ad2c605c7a26d9b852c7942f23f6d))
- Updated dependencies:
  - @effector/router@1.2.0
  - @effector/router-react@1.0.2
  - @effector/router-paths@1.1.0

## 1.0.1

### Patch Changes

- Harden published package manifests: add a `types` condition to each `exports`
  subpath (so `node16`/`nodenext` consumers resolve declarations) and a top-level
  `main` for legacy CJS tooling, and widen internal dependencies from `workspace:*`
  to `workspace:^` so consumers get caret ranges instead of exact pins. ([#17](https://github.com/effector/router/pull/17) [`16c5d32`](https://github.com/effector/router/commit/16c5d32a605ecbcfda59e178dd0fbd34d8c9e57a))
- Updated dependencies:
  - @effector/router@1.1.0
  - @effector/router-react@1.0.1

## 1.0.0

### Patch Changes

- 5e609e8: chore: set new patch version
- Updated dependencies:
  - @effector/router@1.0.0
  - @effector/router-react@1.0.0
