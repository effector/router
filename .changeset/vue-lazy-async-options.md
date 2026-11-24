---
'@effector/router-vue': minor
---

`createLazyRouteView` accepts `error`, `onError`, `timeout`, `delay`, `suspensible` and `hydrate` and passes them to `defineAsyncComponent`. Before, a failed chunk left `fallback` on screen with no way to show an error or retry.

`suspensible` is `false` by default. This changes what shows under an ancestor `<Suspense>`: the view now shows its own `fallback`, before the Suspense fallback showed and `fallback` was ignored. Pass `suspensible: true` for the old behavior.
