---
'@effector/router-vue': minor
---

`RoutesView` and `<Outlet />` accept a default scoped slot with `{ Component, view }`. `Component` is the vnode of the current view for `<component :is="Component" />`, `view` is its `RouteView`. The slot lets an application wrap the view in `KeepAlive` or `Transition`. The type `RouteViewSlotProps` is exported.

`KeepAlive include` matches a view by the name of its component and a view of a `withLayout` group by the name of the layout.

Changed: slot content passed to `RoutesView` or `<Outlet />` was ignored and now replaces the view.
