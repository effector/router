---
'@effector/router': minor
---

Expose the current `trackQuery` evaluation through `$state`, including parsed
parameters and pending route activation. Late-created trackers now derive the
current scoped query state without an imperative check, and each evaluation
parses the schema once.
