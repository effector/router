# Atomic router approach

—

# Argon router approach

```ts
const dashboardRoute = createRoute({ path: '/dashboard', beforeOpen: [adminGuardFx] });
const statsRoute = createRoute({ parent: dashboardRoute, path: '/stats' }); // path —> /dashboard/stats, beforeOpen -> [adminGuardFx]
```

# Note

Path nesting is powerful feature which allows you to don't duplicate route pre-validation logic & nest paths

# Conclusion

Merge argon-router approach without changes.