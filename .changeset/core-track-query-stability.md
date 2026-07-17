---
'@effector/router': patch
---

Make route-filtered `trackQuery` react to explicit route readiness instead of
an artificial microtask delay. Route switches no longer emit transient tracker
states while the selected target is pending, including mapped pathless routes.
