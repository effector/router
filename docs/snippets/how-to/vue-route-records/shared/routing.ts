import { createEvent, sample } from 'effector';
import { createRoute, createRouter, historyAdapter } from '@effector/router';
import { createBrowserHistory } from 'history';

export const routes = {
  home: createRoute({ path: '/' }),
  post: createRoute({ path: '/posts/:id' }),
};

export const router = createRouter({ routes: [routes.home, routes.post] });

/** The application entry calls this event once. */
export const appStarted = createEvent();

sample({
  clock: appStarted,
  fn: () => historyAdapter(createBrowserHistory()),
  target: router.setHistory,
});
