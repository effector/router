---
'@effector/router-vue': patch
---

`<Outlet />` inside a `withLayout` group renders the children of the current view. Before, a page that took over a mounted group got the children of the first page.
