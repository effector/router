# Atomic router approach

`path-to-regexp` library.

# Argon router approach

`@argon-router/paths` library.

# Note

Argon router have more powerful instruments to describe paths (like generics, arguments count and other features), but this
may cause errors in SSR with express/hono/other back-end frameworks

# Conclusion

Merge argon-router approach, but make paths converter from `@argon-router/paths` to back-end frameworks format.