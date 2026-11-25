---
'@effector/router-vue': patch
---

The package is marked as side-effect free (`"sideEffects": false`), and its top-level component definitions carry pure annotations. A bundler now drops the parts of the package an application does not use.
