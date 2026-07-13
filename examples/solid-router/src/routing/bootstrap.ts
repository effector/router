import { allSettled, fork } from 'effector';
import { createBrowserHistory } from 'history';
import { historyAdapter, queryAdapter } from '@effector/router';
import { modalRouter, router, settingsRouter } from './routes';

export const browserHistory = createBrowserHistory();
export const scope = fork();

export async function initializeRouter() {
  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(browserHistory),
  });
  await allSettled(settingsRouter.setHistory, {
    scope,
    params: historyAdapter(browserHistory),
  });
  await allSettled(modalRouter.setHistory, {
    scope,
    params: queryAdapter(browserHistory, { key: 'modal' }),
  });

  await allSettled(scope);
}
