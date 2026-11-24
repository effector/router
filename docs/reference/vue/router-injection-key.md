# RouterInjectionKey

The Vue `InjectionKey<Router>` used by `RouterProvider` and
[`createRouterPlugin`] to provide the router.

Use it only when you need to integrate with Vue `provide`/`inject` directly. In
most applications, use [`RouterProvider`], [`createRouterPlugin`],
[`useRouter`], or `useRouterContext()` instead.

```ts
import { provide } from 'vue';
import { RouterInjectionKey } from '@effector/router-vue';

provide(RouterInjectionKey, router);
```

The key is typed as `InjectionKey<Router>`. It is a registered symbol,
`Symbol.for('@effector/router-vue:router')`, so the ESM and the CJS build of
the package share it.

[`RouterProvider`]: /vue/router-provider
[`createRouterPlugin`]: /vue/create-router-plugin
[`useRouter`]: /vue/use-router
