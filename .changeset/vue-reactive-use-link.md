---
'@effector/router-vue': minor
---

`useLink` and `useIsOpened` accept the route as a value, a ref or a getter. `useLink` takes `params` and `query` as its second and third arguments, in the same forms.

`useLink` also returns:

- `href`: the URL built from `params` and `query`.
- `isActive`: the route is opened and its params contain the params of the link. The params of the whole `parent` chain are compared, after `decodeURIComponent`.
- `isExactActive`: `isActive`, and the route is the last one matched by the current path.
- `navigate(event?)`: opens the route. With a click event it leaves modified, non-primary, prevented, download, non-`_self` and cross-origin clicks to the browser.

`build` and `onOpen` work as in 0.1.0, and `useLink(route)` and `useIsOpened(route)` keep compiling.
