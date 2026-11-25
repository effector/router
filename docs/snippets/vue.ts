import { createRoute, createRouter, group } from '@effector/router';
import {
  createLazyRouteView,
  createRouterPlugin,
  createRoutesView,
  LayoutOutlet,
  Link,
  useIsOpened,
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

const user = createRoute({ path: '/users/:id' });

export function vueReactiveLink(props: { id: string }) {
  const { href, isActive, navigate } = useLink(user, () => ({ id: props.id }));
  const isUserOpened = useIsOpened(() => user);

  return { href, isActive, navigate, isUserOpened };
}

const users = createRoute({ path: '/users' });
const usersSection = group([users, user]);

export function vueFlatRouteTable() {
  const isUsersOpened = useIsOpened(usersSection);

  return () =>
    h(
      Link,
      { to: users, class: { active: isUsersOpened.value } },
      () => 'Users',
    );
}
