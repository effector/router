# redirect

Creates a clock-less Effector target for semantic route redirects.

```ts
function redirect<T>({
  to: PathRoute<T>,
  replace?: boolean,
}): EventCallable<RouteOpenedPayload<T>>
```

## Static redirect

```ts
sample({
  clock: authorization.started,
  target: redirect({ to: routes.signIn, replace: true }),
});
```

## Params and query

Params and query are payload, so dynamic data stays in normal `sample`
composition:

```ts
sample({
  clock: legacyUserOpened,
  fn: ({ id }) => ({
    params: { id },
    query: { source: 'legacy' },
  }),
  target: redirect({ to: routes.user, replace: true }),
});
```

Redirect is not just an alias for `route.open`: it supersedes a currently held
`beforeNavigate` attempt, then enters normal route matching as a new attempt.
This allows an authorization hold to redirect without first calling
`proceed`. Consecutive pre-commit redirects are bounded; a loop is cancelled
with a diagnostic after 16 redirects.

The target deliberately has no `clock`, `source`, `filter`, `params`, or
`query` config. Those are already Effector composition primitives.
