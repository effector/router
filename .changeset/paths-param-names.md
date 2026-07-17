---
'@effector/router-paths': minor
---

Export `getParamNames(pattern)` and `getRequiredParamNames(pattern)`, derived
from the path tokenizer. They are the single source of truth for extracting
parameter names from a pattern, so consumers no longer re-implement the path
grammar with ad-hoc regexes.
