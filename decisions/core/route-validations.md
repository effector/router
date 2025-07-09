# Atomic router approach

Atomic router only have chained routes for post-routing validation

# Argon router approach

```ts
const route = createRoute({ beforeOpen: [authGuardFx], path: '/route' });
```

# Conclusion

Merge argon-router approach without changes.