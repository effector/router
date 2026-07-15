import type { History, Transition } from 'history';
import type { RouterAdapter } from './types';
import { normalizeTo } from './normalize-to';

export function historyAdapter(history: History): RouterAdapter {
  const getLocation = () => {
    const { pathname, search, hash } = history.location;

    return { pathname, search, hash };
  };

  let blockCallback: Parameters<NonNullable<RouterAdapter['block']>>[0] | null =
    null;
  let unblock: (() => void) | null = null;

  const subscribeBlocker = () => {
    if (!blockCallback) return;

    unblock = history.block((transition: Transition) => {
      blockCallback?.({
        action: transition.action,
        location: transition.location,
        retry: () => runWithoutBlocker(() => transition.retry()),
      });
    });
  };

  const runWithoutBlocker = (operation: () => void) => {
    if (!unblock) {
      operation();
      return;
    }

    unblock();
    unblock = null;

    try {
      operation();
    } finally {
      subscribeBlocker();
    }
  };

  return {
    get location() {
      return getLocation();
    },

    push: (to) =>
      runWithoutBlocker(() => history.push(normalizeTo(getLocation(), to))),
    replace: (to) =>
      runWithoutBlocker(() => history.replace(normalizeTo(getLocation(), to))),

    goBack: history.back.bind(history),
    goForward: history.forward.bind(history),

    listen: (callback) => {
      const unlisten = history.listen(({ location }) => callback(location));

      return Object.assign(unlisten, {
        unsubscribe: unlisten,
      });
    },

    block: (callback) => {
      unblock?.();
      blockCallback = callback;
      subscribeBlocker();

      const unsubscribe = () => {
        unblock?.();
        unblock = null;
        blockCallback = null;
      };

      return Object.assign(unsubscribe, { unsubscribe });
    },
  };
}
