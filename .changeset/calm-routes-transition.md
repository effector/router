---
'@effector/router': minor
'@effector/router-react': patch
'@effector/router-solid': patch
'@effector/router-vue': patch
---

Add the composable pre-commit `beforeNavigate` and `redirect` operators, define
pending/cancellation/concurrency for `chainRoute`, and ensure route preparation
runs once per confirmed navigation. Lazy bindings now start dynamic imports at
render time so React/Solid Suspense and Vue loading fallbacks are observable.
