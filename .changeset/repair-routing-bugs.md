---
'@effector/router': patch
'@effector/router-paths': patch
'@effector/router-react': patch
'@effector/router-solid': patch
'@effector/router-vue': patch
---

Fix route parameter parsing and updates, and preserve route-view metadata across
web bindings. Links now expose query parameters in their rendered href, and
Solid links can apply an `activeClass` while their route is open.
