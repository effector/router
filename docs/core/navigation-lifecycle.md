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

Every committed navigation opens a one-microtask hold-collection window so that
`beforeNavigate` holds registered synchronously in the same transaction are
gathered before the location commits. This deferral is uniform: a command
navigation with no attached policy still commits on the next microtask rather
than synchronously. `allSettled(command, { scope })` resolves after the commit,
so scoped tests and SSR observe the settled location regardless.

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

## Design rationale

The public surface intentionally has only two lifecycle composition points. A
pre-commit `beforeNavigate` hold can preserve history semantics when a user
cancels. A post-commit `chainRoute` models preparation and readiness without
delaying the URL. They share a private attempt coordinator, but they are not
the same operator and no public transition, task, barrier, blocker, guard, or
attempt object is introduced.

This boundary follows the roles already established by Effector Router and
adjacent libraries. Atomic Router's `chainRoute` is a derived readiness route
after its parent opens; it cannot undo a committed history entry. Farfetched
barriers are useful for shared recovery around asynchronous work, but do not
model history, confirmation, or redirects. React Router likewise separates
pre-commit blockers from post-commit data loading. The router keeps those roles
composable from ordinary Effector events, effects, stores, and `sample`.

Redirects are semantic navigation targets composed with `sample`; they re-enter
normal matching, supersede a held attempt, and are bounded to prevent loops.
Preparation errors remain normal Effect failures, cancel chained readiness, and
end `$isPending`. Lazy imports belong to framework bindings and their Suspense
or async-component fallback; core `$isPending` describes model preparation,
not chunk loading.

## Non-goals

- A public transition or attempt object.
- A router-specific task, barrier, blocker, guard, or data-loading primitive.
- Recursive `route.open()` calls from preparation hooks.
- Moving Router/history construction into shared route declarations.
