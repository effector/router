import { createRoute } from '@effector/router';
import { createLazyRouteView, useLink } from '@effector/router-vue';

const home = createRoute({ path: '/home' });

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
