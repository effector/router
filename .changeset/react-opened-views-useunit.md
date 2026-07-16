---
'@effector/router-react': patch
---

Subscribe `useOpenedViews` through effector-react `useUnit` (backed by
`useSyncExternalStore`) instead of a hand-rolled `useState`+`useEffect`+
`createWatch` subscription, matching the Solid and Vue bindings. The render
layer now owns subscription, Fork scope, and teardown, removing the
render-vs-effect update gap and hydration/tearing risk.
