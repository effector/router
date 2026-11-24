import { createRoute, createRouter } from '@effector/router';
import {
  createLazyRouteView,
  createRouterPlugin,
  createRoutesView,
  LayoutOutlet,
  useLink,
  withLayout,
  type RouteViewSlotProps,
} from '@effector/router-vue';
import { createApp, h, KeepAlive } from 'vue';

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

const RoutesView = createRoutesView({ routes: [HomeScreen] });

export function vueRoutesViewSlot() {
  return h(RoutesView, null, {
    default: ({ Component }: RouteViewSlotProps) =>
      h(KeepAlive, { include: 'HomePage' }, () => Component),
  });
}

const KeepAliveLayout = () =>
  h(LayoutOutlet, null, {
    default: ({ Component }: RouteViewSlotProps) =>
      h(KeepAlive, null, () => Component),
  });

export const GroupedRoutesView = createRoutesView({
  routes: withLayout(KeepAliveLayout, [HomeScreen]),
});

export function vuePreload(): Promise<void> {
  return HomeScreen.preload();
}

export function vueQuickStart() {
  const link = useLink(home);
  return link.build();
}
