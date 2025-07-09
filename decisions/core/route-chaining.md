# Atomic & Argon router approach

```ts
// route define,,,

const authorized = createEvent();
const rejected = createEvent();

const checkAuthorizationFx = createEffect(async ({ params }) => /* some logic */);

sample({
  clock: checkAuthorizationFx.doneData,
  target: authorized,
});

sample({
  clock: checkAuthorizationFx.failData,
  target: rejected,
});

const virtual = chainRoute({
  route,
  beforeOpen: checkAuthorizationFx,
  openOn: authorized,
  cancelOn: rejected,
});
```

# Conclusion

Merge without changes.