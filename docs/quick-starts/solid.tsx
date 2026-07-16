import { createRouter, createRoute } from '../../packages/core/lib/index';
import {
  createRouteView,
  createRoutesView,
  RouterProvider,
} from '../../packages/solid/lib/index';

export function createSolidQuickStart(): any {
  const home = createRoute();
  const profile = createRoute<{ id: string }>();
  const router = createRouter({ routes: [] });
  const Home = createRouteView({
    route: home,
    view: () => <span data-testid="home">Home</span>,
  });
  const Profile = createRouteView({
    route: profile,
    view: () => <span data-testid="profile">Profile</span>,
  });
  const RoutesView = createRoutesView({ routes: [Home, Profile] });
  const App = () => (
    <RouterProvider router={router}>
      <RoutesView />
    </RouterProvider>
  );

  return { home, profile, router, App, RoutesView };
}
