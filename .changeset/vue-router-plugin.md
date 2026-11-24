---
'@effector/router-vue': minor
---

`createRouterPlugin({ router })` returns a Vue plugin that provides the router to the whole app: `app.use(createRouterPlugin({ router }))`. It attaches no history and registers no components. `RouterProvider` stays, and a nested `RouterProvider` wins for its subtree.

The injection keys and the key `withLayout` puts on a view are registered symbols (`Symbol.for`), so the ESM and the CJS build of the package share them.
