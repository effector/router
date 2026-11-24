---
'@effector/router': patch
---

Fix an infinite Back/Forward loop with browser and hash history. A released native POP was retried while the shared history blocker was already re-armed, so the asynchronous `popstate` of the retry was intercepted as a new navigation and reverted again. The blocker now stays off until the retried POP lands.
