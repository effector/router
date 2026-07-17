---
'@effector/router': patch
---

Coordinate built-in adapters that share one History instance so commands commit
once and native transitions retry only after every adapter proceeds.
