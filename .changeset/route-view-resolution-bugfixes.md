---
'@effector/router': patch
'@effector/router-react': patch
'@effector/router-vue': patch
'@effector/router-solid': patch
---

Fix several edge cases in the `closed`/`loading`/`otherwise` resolution found during review, and share the resolution algorithm across bindings instead of hand-copying it.

- **`otherwise` no longer gets shadowed by an unrelated `closed`.** `createRoutesView`'s resolution used to let any route in its `routes` list win with its `closed` fallback as soon as nothing was open, even for a URL that never matched anything in the list — so declaring `closed` anywhere made `otherwise` nearly unreachable. It now only applies once something in the list has genuinely opened or been pending at least once; `Outlet` (which has no `otherwise` of its own) is unaffected.
- **Solid: a view held through the close/open gap no longer resurfaces later.** The hold introduced for the close/open gap never cleared once set, so an already-abandoned view (the UI correctly showing `otherwise`/nothing) could resurface if some unrelated route elsewhere in the list started pending much later. It now clears whenever nothing claims the frame, matching React and Vue, while still covering the original gap.
- **React: stopped mutating a ref during render.** The previously-resolved view was written to a ref directly in the render body, which React's rules for refs disallow — a render pass can be discarded without committing (Strict Mode's dev double-invoke, an interrupted concurrent render). That write now happens in a `useLayoutEffect`, after a render actually commits.
- **Vue: the resolved view is now identity-stable.** React and Solid already returned the same object reference when a recompute landed on the same view/component, so unrelated router churn wouldn't retrigger consumers. Vue's resolver built a fresh object on every branch, every recompute; it now collapses back to the prior reference the same way.

Internally, the shared priority-resolution algorithm (opened → loading → hold → closed → otherwise) that was hand-copied across the three bindings' `resolve-route-view` files is now one pure function, `resolveRouteView`, exported (`@internal`) from `@effector/router` for the bindings to share. Each binding is left with only its own reactive glue around it.
