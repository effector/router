---
'@effector/router-vue': patch
---

`RoutesView` and `Outlet` no longer create a store on every mount. The route stores go to `useUnit` as a list, so nothing stays linked to them after unmount.
