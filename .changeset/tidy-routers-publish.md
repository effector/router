---
"@effector/router-react-native": patch
"@effector/router-paths": patch
"@effector/router-react": patch
"@effector/router": patch
---

Harden published package manifests: add a `types` condition to each `exports`
subpath (so `node16`/`nodenext` consumers resolve declarations) and a top-level
`main` for legacy CJS tooling, and widen internal dependencies from `workspace:*`
to `workspace:^` so consumers get caret ranges instead of exact pins.
