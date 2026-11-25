---
'@effector/router-vue': minor
---

Each route view renders through its own host component, and each `withLayout` group through one host per group.

Fixed:

- `<Outlet />` showed the children of another view when two views of one `withLayout` group were switched, also when both views used one page component.
- A view declared next to a group could reuse the renderer of the group.
- A `withLayout` group passed as `children` remounted its layout on every page switch.

Changed:

- Sibling views that share one component now remount on a switch.
- An `<Outlet />` placed in a `withLayout` layout renders nothing. Before, it rendered the children of the first page of the group.
- The host has the name of the page component, so `findComponent({ name })`, name-based stubs and devtools see two components with that name.
