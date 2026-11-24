---
'@effector/router': minor
'@effector/router-react': minor
'@effector/router-react-native': minor
'@effector/router-vue': minor
'@effector/router-solid': minor
---

Require effector 23.5 and drop the `effector-action` peer dependency. The router uses `perform` from effector itself where an action picks between several targets, plain `sample` where it doesn't, and an attached effect with `scopeBind` for the history subscription. The bindings follow the same effector peer range so that a workspace resolves one effector instance.
