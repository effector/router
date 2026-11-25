import { createApp, h } from 'vue';
import { allSettled, fork } from 'effector';
import { EffectorScopePlugin } from 'effector-vue/composition';
import { createRouterPlugin } from '@effector/router-vue';
import { appStarted, router } from '../shared/routing';
import { RoutesView } from './routes-view';

const scope = fork();

// The history is attached before the mount. Until then no route is opened,
// and the routes view renders `otherwise`.
await allSettled(appStarted, { scope });

createApp({ render: () => h(RoutesView) })
  .use(EffectorScopePlugin({ scope }))
  .use(createRouterPlugin({ router }))
  .mount('#app');
