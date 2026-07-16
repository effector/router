import {
  createRouter,
  createVirtualRoute,
} from '../../packages/core/lib/index';
import {
  createRouteView,
  createRoutesView,
  RouterProvider,
} from '../../packages/vue/lib/index';
import { h } from 'vue';

export function createVueQuickStart(): any {
  const home = createVirtualRoute();
  const profile = createVirtualRoute<{ id: string }>();
  const router = createRouter({ routes: [] });
  const Home = createRouteView({
    route: home,
    view: () => h('span', { 'data-testid': 'home' }, 'Home'),
  });
  const Profile = createRouteView({
    route: profile,
    view: () => h('span', { 'data-testid': 'profile' }, 'Profile'),
  });
  const RoutesView = createRoutesView({ routes: [Home, Profile] });
  const App = {
    render: () => h(RouterProvider, { router }, () => h(RoutesView)),
  };

  return { home, profile, router, App, RoutesView };
}
