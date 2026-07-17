# beforeNavigate

Holds matching navigation before history changes and exposes ordinary Effector
events for confirmation, cancellation, or redirect.

## API

```ts
const transition = beforeNavigate({
  controls: RouterControls,
  from?: PathRoute | readonly PathRoute[],
  to?: PathRoute | readonly PathRoute[],
  filter?: Store<boolean> | ((navigation: NavigatePayload) => boolean),
})
```

The result contains `started: Event<void>`, `proceed: EventCallable<void>`, and
`cancel: EventCallable<void>`.

`filter: true` means the transition is held. Pre-compose complex state with
`Store.map` or `combine`. If both `from` and `to` are supplied, both must match.
Routes must be registered by a router that uses the same controls.

## Authorization redirect

```ts
const $unauthorized = $session.map(
  (session) => session.status !== 'authorized',
);

const authorization = beforeNavigate({
  controls,
  to: protectedRoutes,
  filter: $unauthorized,
});

sample({
  clock: authorization.started,
  target: redirect({ to: routes.signIn, replace: true }),
});
```

## Async confirmation

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

The confirmation mechanism may be synchronous or asynchronous; the operator
does not prescribe UI. While held, later ordinary navigation intents are
ignored so a late confirmation cannot release the wrong destination.

## Composition

Every matching `beforeNavigate` instance adds one hold. The transition commits
only after all holders proceed. Cancellation by any holder cancels the attempt
and keeps the current history location.

`historyAdapter` and `queryAdapter` implement optional native blocking, so POP
(browser back/forward) uses the same flow. A custom adapter without `block`
still guards router commands, but cannot hold an external POP transition.
Built-in adapters that project the same `History` instance coordinate through
one physical blocker, so each matching controls model must proceed before the
native transition retries once.

`beforeNavigate` is not implemented through `chainRoute`: a chain starts after
`route.opened`, when history has already changed.
