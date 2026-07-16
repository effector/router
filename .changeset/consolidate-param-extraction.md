---
'@effector/router': patch
'@effector/router-react-native': patch
---

Extract route parameter names via `@effector/router-paths` `getParamNames` /
`getRequiredParamNames` instead of hand-rolled regexes in core `createRoute` and
React Native screen-name validation, keeping path-grammar knowledge in one
place. `@effector/router-react-native` now declares `@effector/router-paths` as
a dependency.
