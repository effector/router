# createVirtualRoute

Creates a pathless route for derived readiness and UI state.

## API

```ts
function createVirtualRoute<T = void, Params = void>({
  $isPending?: Store<boolean>,
  transformer?: (payload: T) => Params,
} = {}): VirtualRoute<T, Params>
```

`createVirtualRoute` deliberately has no `beforeOpen` option. Compose behavior
with ordinary Effector units or use [`chainRoute`](/core/chain-route) when the
virtual route represents post-commit preparation.

This factory is deprecated but remains compatible through the current major:
its transformer and external `$isPending` store are preserved. New code can
replace it with `createRoute<Params>()` and ordinary Effector composition.

## Basic UI state

```ts
const confirmDialog = createVirtualRoute<DialogPayload, DialogPayload>({
  transformer: (payload) => payload,
});

confirmDialog.open({ title: 'Delete item?' });
confirmDialog.close();
```

The route exposes `$params`, `$isOpened`, `$isPending`, `open/opened`,
`close/closed`, `cancelled`, and server/client-specific opened events.

## Transform payload

```ts
const userModal = createVirtualRoute<
  { userId: string },
  { id: string; openedAt: number }
>({
  transformer: ({ userId }) => ({
    id: userId,
    openedAt: Date.now(),
  }),
});
```

## Compose pending

`$isPending` is an input Store; its owner remains the surrounding model:

```ts
const loadContentFx = createEffect(() => api.loadContent());

const popup = createVirtualRoute({
  $isPending: loadContentFx.pending,
});

sample({ clock: popup.opened, target: loadContentFx });
```

For a route that must remain closed until the Effect succeeds, use
`chainRoute({ route: popup, beforeOpen: loadContentFx })` instead.

## URL routing

Virtual routes do not have URL patterns and never write history. Use
`createRoute({ path })` for navigation, or map a pathless base route explicitly
in `createRouter`.

## See also

- [chainRoute](/core/chain-route)
- [group](/core/group)
- [Navigation lifecycle](/core/navigation-lifecycle)
