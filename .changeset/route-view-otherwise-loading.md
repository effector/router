---
'@effector/router-react': minor
'@effector/router-solid': minor
'@effector/router-vue': minor
---

Add `otherwise` and `loading` to `createRouteView` and `createLazyRouteView`.

`otherwise` renders while the route is not opened, `loading` renders while the route is pending — a `beforeOpen` effect or a `chainRoute` preparation — and, for lazy views, also fills the chunk wait unless the chunk-only `fallback` is declared.

`createRoutesView` and `Outlet` still render a single view: an opened view always wins, and only when nothing is opened does the last declared fallback render, with a pending `loading` taking precedence over a closed `otherwise`. Fallbacks are wrapped by the view's `layout` and by its `withLayout` group, so a layout stays mounted while a nested chain resolves — the skeleton pattern that nested `atomic-router` route views used to cover.
