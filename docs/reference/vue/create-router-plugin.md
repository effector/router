# createRouterPlugin

Creates a Vue plugin that provides the router to the whole application. It does
for the app what [`RouterProvider`] does for its subtree.

```ts
function createRouterPlugin(options: RouterPluginOptions): Plugin;

interface RouterPluginOptions {
  router: Router;
}
```

The plugin only calls `app.provide(RouterInjectionKey, router)`:

- It does not create or attach a history. Call `router.setHistory` yourself.
- It registers no global components. Import [`Link`], [`Outlet`] and your routes
  view where you use them.
- A [`RouterProvider`] inside the app still wins for its subtree.

### Example

Attach the history in the scope before `mount`:

```ts
import { createApp } from 'vue';
import { allSettled, fork } from 'effector';
import { EffectorScopePlugin } from 'effector-vue/composition';
import { historyAdapter } from '@effector/router';
import { createRouterPlugin } from '@effector/router-vue';
import { createBrowserHistory } from 'history';
import { router } from './router';
import App from './App.vue';

const scope = fork();

await allSettled(router.setHistory, {
  scope,
  params: historyAdapter(createBrowserHistory()),
});

createApp(App)
  .use(EffectorScopePlugin({ scope }))
  .use(createRouterPlugin({ router }))
  .mount('#app');
```

`setHistory` reads the first location asynchronously. If the app mounts before
`allSettled` resolves, the first render has no path and no opened route: the
routes view renders `otherwise` or nothing, and Vue discards a server-rendered
page with a hydration mismatch. With the order above the first render already
has the opened page.

[`RouterProvider`]: /vue/router-provider
[`Link`]: /vue/link
[`Outlet`]: /vue/outlet
