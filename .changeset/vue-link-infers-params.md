---
'@effector/router-vue': minor
---

`Link` infers `params` from the route in `to`. In TSX and in SFC templates checked by `vue-tsc` a missing `params` is a type error for a route with a required param, a wrong `params` is a type error for any route, and a route without params takes none. A route with only optional params needs no `params`, as in 0.1.0. Anchor attributes such as `id` and `rel` are accepted in TSX.

`h(Link, ...)` compiles as in 0.1.0 and does not check `params`.

The type of `Link` is the new exported interface `LinkComponent`, and `LinkPropsOf<typeof route>` gives the props for a route. The type no longer lists the component options, for example `Link.props`, so `extends: Link` and `mixins: [Link]` no longer pass the type check. The runtime is unchanged.
