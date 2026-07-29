---
'@effector/router-react': patch
---

Stop re-rendering the selected branch on unrelated router updates.

The React bindings now keep the resolved selection identity-stable and render it through a memo boundary, so router activity that does not change which view is selected — a sibling chain starting to prepare, for example — no longer re-renders the page and everything below it. `Outlet` gets the same boundary, and the outlet context value is memoized per view.
