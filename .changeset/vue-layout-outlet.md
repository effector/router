---
'@effector/router-vue': minor
---

New component `LayoutOutlet`: placed in the layout of a `withLayout` group, it renders the page of the group. Its default scoped slot `{ Component, view }` lets the layout wrap the page in `KeepAlive` or `Transition`. The default slot of a layout works as before, and `<Outlet />` keeps its meaning.

A navigation by path between two pages of a group mounts the layout again, and the pages cached inside it are lost. The reference page of `LayoutOutlet`, section "When the layout remounts", shows how to keep them.

Outside a `withLayout` layout `LayoutOutlet` renders nothing and reports that through `console.error`.
