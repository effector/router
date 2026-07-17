import { createRoute } from '../../packages/core/lib/index';
import {
  createRouteView,
  createRoutesView,
  RouterProvider,
} from '../../packages/react/lib/index';
import { createElement, type ComponentType } from 'react';
import { createRouter } from '../../packages/core/lib/index';

export function createReactQuickStart(): any {
  const home = createRoute();
  const profile = createRoute<{ id: string }>();
  const router = createRouter({ routes: [] });
  const Home = createRouteView({
    route: home,
    view: () => createElement('span', { 'data-testid': 'home' }, 'Home'),
  });
  const Profile = createRouteView({
    route: profile,
    view: () => createElement('span', { 'data-testid': 'profile' }, 'Profile'),
  });
  const RoutesView = createRoutesView({ routes: [Home, Profile] });
  const App: ComponentType = () =>
    createElement(RouterProvider, {
      router,
      children: createElement(RoutesView),
    });

  return { home, profile, router, App, RoutesView };
}
