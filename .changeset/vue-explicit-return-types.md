---
'@effector/router-vue': patch
---

`useRouter` and `useLink` have explicit return types, exported as `UseRouterReturn` and `UseLinkReturn`. The published types no longer import type names from `effector-vue`. `onOpen` of `useLink` is typed to return its payload, as the route event does.
