---
'@effector/router-paths': patch
---

Parse path patterns with one shared linear tokenizer in `compile` and
`convertPath`. This avoids super-linear regular expression behavior and keeps
embedded parameters such as `/@:user` and `/name-:user?` consistent between
parsing, building, type inference, and Express conversion.
