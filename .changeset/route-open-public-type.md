---
'@effector/router': patch
---

Type `createRoute(...).open` with the public `RouteOpenPayload` contract and
remove the `@ts-expect-error` directives from `create-route.ts` production
source. The normalizing `openFx` now accepts the public payload, the unified
`opened` event is emitted from the existing `createAction` (dropping a
tuple-clock `sample`), and the one genuinely unverifiable
generic-versus-`any` return boundary is a single documented assertion. No
runtime behavior change.
