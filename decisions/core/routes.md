# Atomic router approach

```ts
const usersRoute = createRoute();
```

# Argon router approach

```ts
const usersRoute = createRoute({ path: '/users' });
```

# Note

Both routers (atomic-router and argon-router) declare an approach where each route is a separate entity with a set of parameters. The key difference is that in atomic-router, the path is not bound to the route itself but is specified in the router configuration, whereas argon-router establishes a strict route-path association at the moment of route declaration, which helps infer types from the path during the creation of the route. At the same time, argon-router has a separate abstract entity called VirtualRoute, which is similar to a regular route in atomic-router. Both approaches have their nuances, so the chosen solution was to combine both methods. This way, you can either declare a route and then assign a path to it in the router, or immediately create a path-based route. Such an approach offers significantly greater flexibility and allows you to change declarations quickly, regardless of the initial decision made, covering both the majority of simple use cases as well as especially complex ones, without imposing a specific ideology and giving you the freedom to organize your application's architecture.

# Conclusion

```ts
const userRoute = createRoute(); // Route<T>
const usersRoute = createRoute({ path: '/users' }); // PathRoute<T>
```