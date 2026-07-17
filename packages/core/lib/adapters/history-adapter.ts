import type { History } from 'history';
import type { RouterAdapter } from './types';
import { getHistoryBlockCoordinator } from './history-block-coordinator';
import { normalizeTo } from './normalize-to';

export function historyAdapter(history: History): RouterAdapter {
  const projectLocation = (location: History['location']) => {
    const { pathname, search, hash } = location;

    return { pathname, search, hash };
  };
  const getLocation = () => projectLocation(history.location);
  const blockCoordinator = getHistoryBlockCoordinator(history);

  return {
    get location() {
      return getLocation();
    },

    push: (to) =>
      blockCoordinator.runWithoutBlocking(() =>
        history.push(normalizeTo(getLocation(), to)),
      ),
    replace: (to) =>
      blockCoordinator.runWithoutBlocking(() =>
        history.replace(normalizeTo(getLocation(), to)),
      ),

    goBack: history.back.bind(history),
    goForward: history.forward.bind(history),

    listen: (callback) => {
      const unlisten = history.listen(({ location }) => callback(location));

      return Object.assign(unlisten, {
        unsubscribe: unlisten,
      });
    },

    block: (callback) => blockCoordinator.block(projectLocation, callback),
  };
}
