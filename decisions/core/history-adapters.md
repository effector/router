# Atomic router approach

—

# Argon router approach

—

# Note

Both of routers works only with memory history & browser history objects.

# Conclusion

We need to add support for built-in and custom adapters. This may be useful for query-string routing and other cases, where
memory history is not good choice for builing front-end application.

```ts
const router = createRouter();

router.setHistory(new BrowserHistoryAdapter(history));

// or

router.setHistory(new MemoryHistoryAdapter(history));

// or

router.setHistory(new CustomHistoryAdapter(history));
```