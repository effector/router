---
"@effector/router": patch
---

Enforce the `queryAdapter` `To` contract: a string target is treated as a full path (`pathname[?search][#hash]`, following the `history` convention), identical to its object form. Fixes an inconsistency where an empty object target (`push({})`) wrote a stray `?%2F` while `push('')` cleared the search — both now clear it.
