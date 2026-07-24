# RouterInjectionKey

The Vue `InjectionKey<Router>` used by `RouterProvider` to provide the router.

Use it only when you need to integrate with Vue `provide`/`inject` directly. In
most applications, use [`RouterProvider`], [`useRouter`], or
`useRouterContext()` instead.

```ts
import { provide } from 'vue';
import { RouterInjectionKey } from '@effector/router-vue';

provide(RouterInjectionKey, router);
```

The key is typed as `InjectionKey<Router>`.

[`RouterProvider`]: /vue/router-provider
[`useRouter`]: /vue/use-router
