import { attach, createEvent, createStore } from 'effector';
import {
  chainRoute,
  createRoute,
  createRouter,
  createRouterControls,
  group,
} from '@effector/router';
import type { RouteOpenedPayload } from '@effector/router';

export const homeRoute = createRoute({ path: '/' });
export const projectsRoute = createRoute({ path: '/projects/:projectId' });
export const projectOverviewRoute = createRoute({
  path: '/overview',
  parent: projectsRoute,
});
export const projectTaskRoute = createRoute({
  path: '/tasks/:taskId',
  parent: projectsRoute,
});
export const searchRoute = createRoute({ path: '/search' });
export const reportsRoute = createRoute({ path: '/reports' });
export const protectedRoute = createRoute({ path: '/protected' });

export const helpRoute = createRoute();

export const settingsGeneralRoute = createRoute({ path: '/' });
export const settingsProfileRoute = createRoute({ path: '/profile' });
export const settingsRouter = createRouter({
  base: '/settings',
  routes: [settingsGeneralRoute, settingsProfileRoute],
});

export const modalTaskRoute = createRoute({ path: '/task/:taskId' });
export const modalRouter = createRouter({ routes: [modalTaskRoute] });

export const controls = createRouterControls();
export const router = createRouter({
  controls,
  routes: [
    homeRoute,
    projectsRoute,
    projectOverviewRoute,
    projectTaskRoute,
    searchRoute,
    reportsRoute,
    protectedRoute,
    settingsRouter,
  ],
});

router.registerRoute({ path: '/help', route: helpRoute });

export const authChanged = createEvent<boolean>();
export const $authorized = createStore(false).on(
  authChanged,
  (_, value) => value,
);

const checkAuthFx = attach({
  source: $authorized,
  effect: (authorized, payload: RouteOpenedPayload<void>) => {
    if (!authorized) throw new Error('Authorization required');
    return payload;
  },
});

export const protectedVisibleRoute = chainRoute({
  route: protectedRoute,
  beforeOpen: checkAuthFx,
  openOn: checkAuthFx.done,
  cancelOn: checkAuthFx.fail,
});

export const projectGroup = group([
  projectsRoute,
  projectOverviewRoute,
  projectTaskRoute,
]);
export const drawerRoute = createRoute<{ panel: string }>();
