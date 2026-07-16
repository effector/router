# Navigation lifecycle

effector/router separates history policy from route readiness:

1. A route or `controls.navigate` produces a navigation intent.
2. [`beforeNavigate`](/core/before-navigate) may hold it before history changes.
3. The adapter commits the location and matching routes activate.
4. [`chainRoute`](/core/chain-route) prepares a post-commit derived route.
5. A framework binding renders the view; lazy imports and fallbacks belong to
   that binding.

This is one internal attempt model with two public composition points. A
pre-commit operator can preserve correct history on cancel. A post-commit chain
can expose readiness without delaying the URL.

## State and concurrency

| Phase                    | Pending owner                                      | Repeated transition                               |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------- |
| `beforeNavigate` hold    | Application model through `started/proceed/cancel` | Ordinary intents are ignored; redirect supersedes |
| Route activation         | Deprecated `createRoute.beforeOpen`                | Latest location activation wins                   |
| `chainRoute` preparation | Chained route `$isPending`                         | Latest parent activation wins                     |
| Lazy component import    | React/Solid Suspense or Vue async component        | Framework cache and retry rules                   |

Cancellation before commit leaves history unchanged. An Effect error after
commit is observed through that Effect's standard `fail`/`failData`; it cancels
the chained readiness route and ends pending.

## FSD setup

Create routes and controls in the lower layer:

```ts
// shared/routing.ts
export const controls = createRouterControls();
export const routes = {
  home: createRoute({ path: '/' }),
  editor: createRoute({ path: '/editor/:id' }),
};
```

Features compose policy from those units:

```ts
const leaveEditor = beforeNavigate({
  controls,
  from: routes.editor,
  filter: $hasUnsavedChanges,
});

sample({ clock: leaveEditor.started, target: confirmDialog.open });
sample({ clock: confirmDialog.confirmed, target: leaveEditor.proceed });
sample({ clock: confirmDialog.cancelled, target: leaveEditor.cancel });
```

Only the app layer creates the router and attaches platform history:

```ts
export const router = createRouter({
  routes: Object.values(routes),
  controls,
});

controls.setHistory(historyAdapter(createBrowserHistory()));
```

## Compatibility

`createRoute({ beforeOpen })` remains available but is deprecated. It runs once
after confirmed location activation and cannot block history. Use
`beforeNavigate` for transition policy and `chainRoute` for readiness.

`createVirtualRoute` does not implement `beforeOpen`; compose behavior with
ordinary events/effects or derive a route with `chainRoute`.

## Compatibility matrix

The core regression suite keeps the accepted phase boundaries executable:

| Invariant                                                              | Coverage                          |
| ---------------------------------------------------------------------- | --------------------------------- |
| One preparation per committed transition, including query-only updates | `lifecycle-compatibility.test.ts` |
| Pending starts and ends around `chainRoute` preparation                | `chained-routes.test.ts`          |
| Preparation failure and parent cancellation end pending                | `chained-routes.test.ts`          |
| Repeated chain activation is `takeLatest`                              | `chained-routes.test.ts`          |
| Held navigation can be cancelled or proceeded                          | `navigation.test.ts`              |
| Redirects supersede holds and loops are bounded                        | `navigation.test.ts`              |
| Native POP respects the same hold/cancel boundary                      | `navigation.test.ts`              |
