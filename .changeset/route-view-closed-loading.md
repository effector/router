---
'@effector/router-react': minor
'@effector/router-solid': minor
'@effector/router-vue': minor
---

Add `closed` and `loading` to `createRouteView` and `createLazyRouteView`.

`closed` renders while the route is not opened, `loading` renders while the route is pending — a `beforeOpen` effect or a `chainRoute` preparation — and, for lazy views, also fills the chunk wait.

`createRoutesView` and `Outlet` still render a single view: an opened view always wins, and only when nothing is opened does the last declared fallback render, with a pending `loading` taking precedence over a `closed` view. Fallbacks are wrapped by the view's `layout` and by its `withLayout` group, so a layout stays mounted while a nested chain resolves — the skeleton pattern that nested `atomic-router` route views used to cover.

This also removes the flash of the routes view `otherwise` (usually the not-found screen) while a lazy view was loading. `createLazyRouteView`'s `fallback` only covered the chunk request; it is deprecated in favour of `loading`, which covers both waits, and keeps working as its alias.
