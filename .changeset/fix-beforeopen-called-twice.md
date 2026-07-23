---
'@effector/router': patch
---

Fix `beforeOpen` running twice on link navigation. Opening a route via `route.open()` (what `<Link>` does) ran its `beforeOpen` guards once to navigate, then a second time when the resulting location update echoed back through the route — briefly leaving the route unopened (the reported "404 flash"). The route now recognizes its own navigation echo and opens without re-running `beforeOpen`.
