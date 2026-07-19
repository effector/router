# @effector/router-vue

## 0.1.0

### Minor Changes

- Add `@effector/router-vue` with Vue 3 components and composables for rendering
  routes, navigating with links, lazy loading, and nested outlets. Supports Vue
  3.5 and newer. ([#44](https://github.com/effector/router/pull/44) [`540f54c`](https://github.com/effector/router/commit/540f54ca49de13a73a1935e091c1388ee1fddbae))

### Patch Changes

- Add the composable pre-commit `beforeNavigate` and `redirect` operators, define
  pending/cancellation/concurrency for `chainRoute`, and ensure route preparation
  runs once per confirmed navigation. Lazy bindings now start dynamic imports at
  render time so React/Solid Suspense and Vue loading fallbacks are observable. ([#82](https://github.com/effector/router/pull/82) [`4200e69`](https://github.com/effector/router/commit/4200e69f7ccd1971da3c38393936d3e76592cb4d))

- Align Link and useLink href serialization with the core query codec and route
  navigation semantics. ([#82](https://github.com/effector/router/pull/82) [`3865f69`](https://github.com/effector/router/commit/3865f69f42fa089bebe26e04f9c9584ed6eb84fe))

- Keep layouts mounted across sibling route-view switches with binding-private
  layout group metadata. ([#82](https://github.com/effector/router/pull/82) [`e9f7bab`](https://github.com/effector/router/commit/e9f7babfb060d3aa477ddd006777c4e39ac78661))

- Complete lazy/eager RouteView parity coverage for render-time imports,
  fallbacks, recursive children, and application-owned preloading. ([#82](https://github.com/effector/router/pull/82) [`4219358`](https://github.com/effector/router/commit/4219358c5099764e42e83f64a8fa37cb9b905ade))

- Preserve native anchor behavior for non-primary, modified, download, cross-origin,
  and non-self target clicks. ([#82](https://github.com/effector/router/pull/82) [`9fbe080`](https://github.com/effector/router/commit/9fbe080f65a97d371b70e2d27b7f55052a14fa7b))

- Verify persistent layout instances across grouped sibling transitions and
  unmount them when leaving the group. ([#82](https://github.com/effector/router/pull/82) [`c4b8e60`](https://github.com/effector/router/commit/c4b8e6010f63506a5ea35a188adf3956e3490dfc))

- Centralize URL query encoding and expose QueryInput removal semantics across
  core and framework link types. ([#82](https://github.com/effector/router/pull/82) [`2672fb2`](https://github.com/effector/router/commit/2672fb26e2b25a5447b5afb56d8a5fb9cd2bec48))

- Align query replacement, preservation, and clearing semantics across navigation,
  route opens, redirects, and framework link hrefs. ([#82](https://github.com/effector/router/pull/82) [`18805d8`](https://github.com/effector/router/commit/18805d85ce0f2a3db012fd387c3b7b453820014d))

- Make Outlet recursive across React, Solid, and Vue so nested RouteView trees
  receive each selected child's children. ([#82](https://github.com/effector/router/pull/82) [`fe905b3`](https://github.com/effector/router/commit/fe905b33079c4ba1f0c7c0fa2fa91ec3f3198dd4))

- Fix route parameter parsing and updates, and preserve route-view metadata across
  web bindings. Links now expose query parameters in their rendered href, and
  Solid links can apply an `activeClass` while their route is open. ([#82](https://github.com/effector/router/pull/82) [`5d244fd`](https://github.com/effector/router/commit/5d244fd5d71a01320e75a0c8b70cd421e2999dbf))

- Complete the cross-binding RouteView matrix and synchronize its documentation. ([#82](https://github.com/effector/router/pull/82) [`0b71111`](https://github.com/effector/router/commit/0b711115315caee8171a5db642f651e4584bda3c))

- Document and verify declarative RouteView selection priority across web
  bindings. ([#82](https://github.com/effector/router/pull/82) [`516bb03`](https://github.com/effector/router/commit/516bb03f627c5366e3a27512ca203fba1ebe866d))

- Complete Vue Link query, replacement, event-forwarding, anchor-attribute, and
  conditional LinkProps coverage. ([#82](https://github.com/effector/router/pull/82) [`f4d6455`](https://github.com/effector/router/commit/f4d6455706234392ad53351af02e95caaed6296b))

- Document and verify the shared cross-binding web Link contract matrix. ([#82](https://github.com/effector/router/pull/82) [`2e9b4ec`](https://github.com/effector/router/commit/2e9b4ecda39347bd9f2e3226caccdd8f644cf2bd))

- Updated dependencies:
  - @effector/router@1.2.0
