import { createRoute, createRouter } from '@effector/router';
import {
  createLazyRouteView,
  createRouterPlugin,
  useLink,
} from '@effector/router-vue';
import { createApp } from 'vue';

const home = createRoute({ path: '/home' });
const router = createRouter({ routes: [home] });

export function vueRouterPlugin() {
  return createApp({ render: () => null }).use(createRouterPlugin({ router }));
}

export const HomeScreen = createLazyRouteView({
  route: home,
  view: async () => ({ default: { render: () => null } }),
  name: 'HomePage',
});

export function vuePreload(): Promise<void> {
  return HomeScreen.preload();
}

export function vueQuickStart() {
  const link = useLink(home);
  return link.build();
}
