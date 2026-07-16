---
'@effector/router': patch
---

Keep a parent route open while switching between its child routes. The router's
close pass treated a nested URL (e.g. `/profile/friends`) as not matching the
parent pattern (`/profile`) and closed the parent, which its child immediately
re-opened — making `parent.$isOpened` flicker `false→true`. Ancestors of matched
routes are now preserved, so the parent stays open and bindings do not unmount
and remount the parent view.
