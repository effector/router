# Atomic router approach

Atomic router doesn't have mechanisms for creating lazy-loaded routes.

# Argon router approach

In argon router any route has its own set of beforeOpen rules and the setAsyncImport function, which is used in createLazyView, which allows you to specify which bundle should be loaded before opening the route.

# Conclusion

Merge argon-router approach, but now `createLazyView` adds an effect in beforeOpen instead of calling route's `setAsyncImport`.