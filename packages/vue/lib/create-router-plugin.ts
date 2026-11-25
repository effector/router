import type { Plugin } from 'vue';
import type { Router } from '@effector/router';
import { RouterInjectionKey } from './context';

export interface RouterPluginOptions {
  router: Router;
}

/**
 * @description Vue plugin that provides the router to the whole application.
 * It does for the app what `<RouterProvider>` does for its subtree, and
 * nothing else: it attaches no history and registers no components.
 * A `<RouterProvider>` inside the app still wins for its subtree.
 * @link https://router.effector.dev/vue/create-router-plugin.html
 * @example ```ts
 * import { createApp } from 'vue';
 * import { createRouterPlugin } from '@effector/router-vue';
 * import { router } from './router';
 * import App from './App.vue';
 *
 * createApp(App).use(createRouterPlugin({ router })).mount('#app');
 * ```
 */
export function createRouterPlugin(options: RouterPluginOptions): Plugin<[]> {
  return {
    install(app) {
      app.provide(RouterInjectionKey, options.router);
    },
  };
}
