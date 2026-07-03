---
"@effector/router": minor
---

Add an optional named query key mode to `queryAdapter`: `queryAdapter(history, { key })`.

Instead of owning the whole `location.search`, the nested route is stored in a single named query parameter (e.g. `?modal=%2Fuser%2F1`), preserving all other query parameters on the host URL. This lets a query router coexist with the host app or with other `queryAdapter` routers (`?modal=…&tab=…`). Without options the behavior is unchanged (whole-search mode).
