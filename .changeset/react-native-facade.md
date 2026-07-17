---
'@effector/router-react-native': minor
---

Re-export platform-neutral React bindings from the React Native package so
applications do not need a separate React bindings import. Browser-only
`Link`, `useLink`, and `LinkProps` remain available only from
`@effector/router-react`; the core router API remains available from
`@effector/router`.
