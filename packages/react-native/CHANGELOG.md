# @effector/router-react-native

## 1.1.0

### Minor Changes

- [#82](https://github.com/effector/router/pull/82) [`0222882`](https://github.com/effector/router/commit/02228824db3d605842250d9a10911c025b53378c) Thanks [@sergeysova](https://github.com/sergeysova)! - Re-export platform-neutral React bindings from the React Native package so
  applications do not need a separate React bindings import. Browser-only
  `Link`, `useLink`, and `LinkProps` remain available only from
  `@effector/router-react`; the core router API remains available from
  `@effector/router`.

### Patch Changes

- [#82](https://github.com/effector/router/pull/82) [`38ccf80`](https://github.com/effector/router/commit/38ccf804c3bd8c7ad9baa242b9b893e9eb4b065a) Thanks [@sergeysova](https://github.com/sergeysova)! - Extract route parameter names via `@effector/router-paths` `getParamNames` /
  `getRequiredParamNames` instead of hand-rolled regexes in core `createRoute` and
  React Native screen-name validation, keeping path-grammar knowledge in one
  place. `@effector/router-react-native` now declares `@effector/router-paths` as
  a dependency.

- [#82](https://github.com/effector/router/pull/82) [`055e0e8`](https://github.com/effector/router/commit/055e0e81f75ad5d156153500589eccac64942198) Thanks [@sergeysova](https://github.com/sergeysova)! - Clarify the React Native adapter boundary and remove untested deep-link, persistence, time-travel, and gesture-flow claims from the documentation.

- [#82](https://github.com/effector/router/pull/82) [`9542fbd`](https://github.com/effector/router/commit/9542fbdeff31467984020207cf3b1a11968fc80d) Thanks [@sergeysova](https://github.com/sergeysova)! - Add a React Native integration harness covering direct navigator components,
  screen/options rendering, readiness races, params, tab intent, echo suppression,
  and cleanup.

- [#82](https://github.com/effector/router/pull/82) [`758692e`](https://github.com/effector/router/commit/758692e4aca840c4707eb9d63100d1057ce679ab) Thanks [@sergeysova](https://github.com/sergeysova)! - Translate React Navigation focus, removal, closing gestures, and tab presses to
  scoped Router route units without exposing a native-intent API.

- [#82](https://github.com/effector/router/pull/82) [`27e15d2`](https://github.com/effector/router/commit/27e15d2b49e7f2c0214016f05b9a0f72a490b560) Thanks [@sergeysova](https://github.com/sergeysova)! - Add stack and bottom-tabs native RouteView option types and pass per-screen
  options through without manual merging.

- [#82](https://github.com/effector/router/pull/82) [`5d1c4d5`](https://github.com/effector/router/commit/5d1c4d5e8099d66f7e13d6c41f47d1dd5ce64e0c) Thanks [@sergeysova](https://github.com/sergeysova)! - Return React Native navigators directly and connect them to an app-owned
  NavigationContainer ref with ready/state lifecycle cleanup.

- [#82](https://github.com/effector/router/pull/82) [`e909dee`](https://github.com/effector/router/commit/e909dee42390d90bc7eef5ca7585437b9c41a7d6) Thanks [@sergeysova](https://github.com/sergeysova)! - Gate Router-to-native synchronization on ref readiness, preserve params and
  replace intent, retain only the latest pre-ready target, and suppress matching
  native echoes.

- [#82](https://github.com/effector/router/pull/82) [`c53f769`](https://github.com/effector/router/commit/c53f769012295e412b072d71c19b726174801cb4) Thanks [@sergeysova](https://github.com/sergeysova)! - Derive React Native screen names from complete parent path templates and reject
  unsupported parameterized initial routes and bottom-tab screens.

- [#82](https://github.com/effector/router/pull/82) [`c0ef37a`](https://github.com/effector/router/commit/c0ef37acfd2ad2c605c7a26d9b852c7942f23f6d) Thanks [@sergeysova](https://github.com/sergeysova)! - Keep React Navigation screen names equal to route paths so `initialRouteName`
  uses the same value as registered screens. Navigator `screenOptions` now also
  accept React Navigation's callback form without reapplying global options per
  screen. Nested route views are registered as navigator screens.
  Router transitions now target the navigation object provided by
  `NavigationContainer`.
  Native screen focus events now open their matching Effector routes.
- Updated dependencies [[`4200e69`](https://github.com/effector/router/commit/4200e69f7ccd1971da3c38393936d3e76592cb4d), [`38ccf80`](https://github.com/effector/router/commit/38ccf804c3bd8c7ad9baa242b9b893e9eb4b065a), [`9b0404f`](https://github.com/effector/router/commit/9b0404f24ca8581b884ec55a9375209dfcfcc9cb), [`8798ff4`](https://github.com/effector/router/commit/8798ff487f68f364864d7d5c7b907ce31d9e828b), [`a72f373`](https://github.com/effector/router/commit/a72f3739eb0b9dc1aa83d38dc10a1d8d94dcb808), [`eda3d34`](https://github.com/effector/router/commit/eda3d3426ce3d95a85f9fc3d640ca25b30b3e7b0), [`0c4e2bd`](https://github.com/effector/router/commit/0c4e2bd35430d565f8183b81e0ef70c815ffe282), [`f2af6b4`](https://github.com/effector/router/commit/f2af6b4f52065ef60a1d8b5a5ded486e868cbb55), [`3865f69`](https://github.com/effector/router/commit/3865f69f42fa089bebe26e04f9c9584ed6eb84fe), [`d013248`](https://github.com/effector/router/commit/d013248fe72ad61ad0fbb2166ee34dc658debeed), [`e9f7bab`](https://github.com/effector/router/commit/e9f7babfb060d3aa477ddd006777c4e39ac78661), [`4219358`](https://github.com/effector/router/commit/4219358c5099764e42e83f64a8fa37cb9b905ade), [`b986fc3`](https://github.com/effector/router/commit/b986fc3e86f0d93310d43f320a4c188109e9075b), [`9e98788`](https://github.com/effector/router/commit/9e98788609e3a36c4685322d58ceafea1aa1c447), [`fd3d1c2`](https://github.com/effector/router/commit/fd3d1c260330f2c3f640c85bfd29d10d7d15ba34), [`9fbe080`](https://github.com/effector/router/commit/9fbe080f65a97d371b70e2d27b7f55052a14fa7b), [`e1a3985`](https://github.com/effector/router/commit/e1a3985b6db6934f06ea26ac4e79182385e8dc06), [`ba7ef23`](https://github.com/effector/router/commit/ba7ef2382c3f5ea3e115aeb6c56ff5f09b840511), [`30cfeb0`](https://github.com/effector/router/commit/30cfeb07b61e6e9a9fc55eae96ac516d9583544d), [`474bcc5`](https://github.com/effector/router/commit/474bcc5dd2cb6dea54d5b7f04c2e8e94c9ad7d67), [`4bcdba8`](https://github.com/effector/router/commit/4bcdba83463709f0e62be07a02b3b094ed51bc49), [`88ed1e0`](https://github.com/effector/router/commit/88ed1e0c6f381bdd887b5f53c38cd153452cade5), [`1b98a47`](https://github.com/effector/router/commit/1b98a4773224fed2a1d511b3277d7bed86fb9267), [`4a03bd0`](https://github.com/effector/router/commit/4a03bd0557969640f68708970a60cab78936fd8d), [`fc36192`](https://github.com/effector/router/commit/fc36192cffbad1b32087562b072404716895b6b8), [`fd3937f`](https://github.com/effector/router/commit/fd3937fe3812ea60de869b14bef2e7cd822de765), [`709bca0`](https://github.com/effector/router/commit/709bca0e05efc9635d8bc58994998cc58c179694), [`51aa95d`](https://github.com/effector/router/commit/51aa95daf652461014016a071b881ae7980c93e5), [`38ccf80`](https://github.com/effector/router/commit/38ccf804c3bd8c7ad9baa242b9b893e9eb4b065a), [`c4b8e60`](https://github.com/effector/router/commit/c4b8e6010f63506a5ea35a188adf3956e3490dfc), [`95d031a`](https://github.com/effector/router/commit/95d031ae4298c1ce9cf331b06afedabc0870cab6), [`2c8148a`](https://github.com/effector/router/commit/2c8148a9d72232d6bab9f4a8b0f0b825af71a6b4), [`2672fb2`](https://github.com/effector/router/commit/2672fb26e2b25a5447b5afb56d8a5fb9cd2bec48), [`9102583`](https://github.com/effector/router/commit/9102583bc370e32100e60a9fc37199504d6dfea2), [`672f427`](https://github.com/effector/router/commit/672f4278a9bd0009b4bf82d8553f6842c90d0906), [`18805d8`](https://github.com/effector/router/commit/18805d85ce0f2a3db012fd387c3b7b453820014d), [`a502d68`](https://github.com/effector/router/commit/a502d68b3bbe894bbd14ad9a2314e69436af125a), [`44105e8`](https://github.com/effector/router/commit/44105e8f16419556f2d6d5100655724558332795), [`fc36192`](https://github.com/effector/router/commit/fc36192cffbad1b32087562b072404716895b6b8), [`fe905b3`](https://github.com/effector/router/commit/fe905b33079c4ba1f0c7c0fa2fa91ec3f3198dd4), [`5d244fd`](https://github.com/effector/router/commit/5d244fd5d71a01320e75a0c8b70cd421e2999dbf), [`9dc6c2f`](https://github.com/effector/router/commit/9dc6c2f4fbfc2d35d8ba9c6ce4a7619a7e82efe2), [`7983df2`](https://github.com/effector/router/commit/7983df2ae762f6a7bd9735c6b6b0cbca5ca00bd8), [`5abb9da`](https://github.com/effector/router/commit/5abb9dafc8f0f937cfda1d3d168335855324d966), [`b01c71e`](https://github.com/effector/router/commit/b01c71e7345fb15de67ca8fbe7fab3527b55acc8), [`fb708b9`](https://github.com/effector/router/commit/fb708b9d62318cc544bd2c23c6bee2fe7250f1b1), [`0b71111`](https://github.com/effector/router/commit/0b711115315caee8171a5db642f651e4584bda3c), [`516bb03`](https://github.com/effector/router/commit/516bb03f627c5366e3a27512ca203fba1ebe866d), [`bc30897`](https://github.com/effector/router/commit/bc308972567f4d1081653e0dc93cf9e9ada5d49a), [`4158b70`](https://github.com/effector/router/commit/4158b701dff777a3f61c7ea418ea7f69c341e293), [`3f0d4b3`](https://github.com/effector/router/commit/3f0d4b3efd1141198eae8acfba2f0d35ab32febe), [`136a1f0`](https://github.com/effector/router/commit/136a1f06cf4bb4a0c06d039a4536433168056b39), [`d39555a`](https://github.com/effector/router/commit/d39555acaef132a04b4b3b286a2ee9c0f2625c98), [`7e86724`](https://github.com/effector/router/commit/7e86724e53ba723fb0f9f4446ba2e2c982fbe54c), [`f7a03cd`](https://github.com/effector/router/commit/f7a03cd4e10c32af2544b2a6cabe22681afbd6a4), [`cdb47e1`](https://github.com/effector/router/commit/cdb47e103cfb281f557b1ceb693c84ac43c37d8c), [`d5e22b1`](https://github.com/effector/router/commit/d5e22b1b3e882461d472c7807ebf14c6c53652cf), [`2e9b4ec`](https://github.com/effector/router/commit/2e9b4ecda39347bd9f2e3226caccdd8f644cf2bd)]:
  - @effector/router@1.2.0
  - @effector/router-react@1.0.2
  - @effector/router-paths@1.1.0

## 1.0.1

### Patch Changes

- [#17](https://github.com/effector/router/pull/17) [`16c5d32`](https://github.com/effector/router/commit/16c5d32a605ecbcfda59e178dd0fbd34d8c9e57a) Thanks [@sergeysova](https://github.com/sergeysova)! - Harden published package manifests: add a `types` condition to each `exports`
  subpath (so `node16`/`nodenext` consumers resolve declarations) and a top-level
  `main` for legacy CJS tooling, and widen internal dependencies from `workspace:*`
  to `workspace:^` so consumers get caret ranges instead of exact pins.
- Updated dependencies [[`591c462`](https://github.com/effector/router/commit/591c462c25ab81bf3b706e14982e91cc7b778bc3), [`556c1c6`](https://github.com/effector/router/commit/556c1c62427fba298760d517a2cab314d1f06a05), [`591c462`](https://github.com/effector/router/commit/591c462c25ab81bf3b706e14982e91cc7b778bc3), [`16c5d32`](https://github.com/effector/router/commit/16c5d32a605ecbcfda59e178dd0fbd34d8c9e57a)]:
  - @effector/router@1.1.0
  - @effector/router-react@1.0.1

## 1.0.0

### Patch Changes

- 5e609e8: chore: set new patch version
- Updated dependencies [ee7525a]
- Updated dependencies [5e609e8]
  - @effector/router@1.0.0
  - @effector/router-react@1.0.0
