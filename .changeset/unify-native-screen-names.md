---
'@effector/router-react-native': patch
---

Keep React Navigation screen names equal to route paths so `initialRouteName`
uses the same value as registered screens. Navigator `screenOptions` now also
accept React Navigation's callback form without reapplying global options per
screen. Nested route views are registered as navigator screens.
