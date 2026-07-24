import { allSettled, fork } from 'effector';
import { Provider } from 'effector-react';
import { createRoot } from 'react-dom/client';
import { createBrowserHistory } from 'history';
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import {
  RouterProvider,
  createRouteView,
  createRoutesView,
  Link,
} from '@effector/router-react';

// 1. Define routes
const homeRoute = createRoute({ path: '/' });
const profileRoute = createRoute({ path: '/profile' });

// 2. Create the router
export const router = createRouter({ routes: [homeRoute, profileRoute] });

// 3. Create a view for each route
const Home = createRouteView({
  route: homeRoute,
  view: () => (
    <div>
      <h1>Home</h1>
      <Link to={profileRoute}>Go to profile</Link>
    </div>
  ),
});

const Profile = createRouteView({
  route: profileRoute,
  view: () => (
    <div>
      <h1>Profile</h1>
      <Link to={homeRoute}>Back home</Link>
    </div>
  ),
});

// 4. Render whichever route is currently open
const RoutesView = createRoutesView({ routes: [Home, Profile] });

// 5. Provide the router to the React tree
export function App() {
  return (
    <RouterProvider router={router}>
      <RoutesView />
    </RouterProvider>
  );
}

// 6. Initialize the router with browser history, inside an Effector scope
const scope = fork();

async function main() {
  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(createBrowserHistory()),
  });

  createRoot(document.getElementById('root')!).render(
    <Provider value={scope}>
      <App />
    </Provider>,
  );
}

main();
