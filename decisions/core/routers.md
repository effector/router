# Atomic router approach

```ts
const userRoute = createRoute();

const router = createRouter({
    routes: [
        { path: '/user/:id', route: userRoute },
    ],
});
```

# Argon router approach

```ts
const userRoute = createRoute({ path: '/user/:id' });

const router = createRouter({
    routes: [userRoute],
});
```

# Note

When choosing an approach for [/routes](declaring routes), we came to the conclusion that we need to support two types of routes: those that are not bound to a path, and those that are immediately associated with a path. This decision shapes the architecture of the router configuration itself. In the new router, we decided to adopt a flexible method: you can either specify a path for a route (if it is not already path-based), or simply pass a path-based route as is.

# Conclusion

```ts
const userRoute = createRoute();
const usersRoute = createRoute({ path: '/users' });

const router = createRouter({
    routes: [
        { path: '/user/:id', route: userRoute },
        usersRoute,
    ],
});
```