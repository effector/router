---
'@effector/router-vue': minor
---

`Link` shows its active state:

- Props `activeClass` and `exactActiveClass` add a class while the link is active or exactly active. There are no default class names.
- An exactly active link gets `aria-current="page"`. An `aria-current` attribute passed to `Link` wins.
- The default slot receives `{ href, isActive, isExactActive, navigate }`. The type `LinkSlotProps` is exported.

A link is active when its route is opened and the params of the route and of its `parent` chain contain the params of the link. Values are compared after `decodeURIComponent`, and a malformed percent sequence does not throw.

Changed: a `Link` written for 0.1.0 renders the same markup with one exception, `aria-current="page"` on an exact match.
