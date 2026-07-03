---
"@effector/router": patch
---

Fix `queryAdapter` crashing on relative paths and empty `location.search` by using `history` path helpers (`parsePath`/`createPath`) instead of `new URL(...)`. Fixes #7.

pr: 10
