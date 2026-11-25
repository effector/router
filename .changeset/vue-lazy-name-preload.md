---
'@effector/router-vue': minor
---

`createLazyRouteView` returns a `LazyRouteView`: a route view with `preload(): Promise<void>`. The render and `preload()` share one request, and a view mounted after the promise resolved never mounts `fallback`. A failed request is dropped, so the next call loads again.

`createRouteView` and `createLazyRouteView` accept `name`, the component name of the view. `KeepAlive include` matches a lazy view by this name before its chunk loads.
