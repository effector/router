# Web Link contract matrix

React, Solid, and Vue bindings share the same web Link contract. The binding
tests keep the following cases aligned:

| Case                            | Expected behavior                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Rendered href                   | Complete path params plus effective query; omission preserves current query, an explicit object replaces it, and `{}` clears it. |
| Ordinary click                  | Intercept primary-button, same-origin `_self` clicks and call the route open unit with params, query, and replace.               |
| Secondary or modified click     | Keep native anchor behavior.                                                                                                     |
| `target != "_self"`             | Keep native anchor behavior.                                                                                                     |
| `download` or cross-origin href | Keep native anchor behavior.                                                                                                     |
| User cancellation               | Run the user handler first; `preventDefault()` skips route opening.                                                              |
| Anchor API                      | Forward standard attributes; React forwards refs, Solid exposes reactive `useLink`, and Vue forwards attrs/events.               |
| Parameter types                 | Require `params` for routes with required keys and allow omission for pathless/empty routes.                                     |

The executable coverage lives in:

- `packages/react/tests/index.test.tsx` and `link-types.test.tsx`
- `packages/solid/tests/index.test.tsx` and `link-types.test.tsx`
- `packages/vue/tests/index.test.ts` and `link-types.test.ts`

Run the binding slice from the repository root:

```sh
pnpm :react test
pnpm :solid test
pnpm :vue test
pnpm typecheck
```
