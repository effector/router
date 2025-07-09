# Atomic router approach

`useLink` — builds route path
`useIsOpened` — returns if route opened or not

# Argon router approach

`withLayout` — set passed layout for routes
`useRouter` — get router `@@unitShape` api in UI components
`useRouterContext` — get router object in UI components

# Note

In both routers approach we don't have helper `useRoute` (for migration from hooks-oriented code).

# Conclusion

Merge both routers approarch with `useRoute` helper.

`useLink` — builds route path
`useIsOpened` — returns if route opened or not
`withLayout` — set passed layout for routes
`useRouter` — get router `@@unitShape` api in UI components
`useRouterContext` — get router object in UI components
`useRoute` — get route `@@unitShape` api in UI components