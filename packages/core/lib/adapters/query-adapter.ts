import { createPath, parsePath, type History } from 'history';
import type { RouterAdapter, RouterLocation, To } from './types';

function emptyLocation(): RouterLocation {
  return {
    pathname: '/',
    search: '',
    hash: '',
  };
}

function extractLocation(location: History['location']): RouterLocation {
  if (!location.search || location.search === '?') {
    return emptyLocation();
  }

  const search = location.search.startsWith('?')
    ? location.search.slice(1)
    : location.search;

  if (!search) {
    return emptyLocation();
  }

  const {
    pathname,
    search: nestedSearch,
    hash,
  } = parsePath(decodeURIComponent(search));

  return {
    pathname: pathname ?? '/',
    search: nestedSearch ?? '',
    hash: hash ?? '',
  };
}

function stringifyTo(to: To): string {
  if (typeof to === 'string') {
    return to;
  }

  return createPath({
    pathname: to.pathname ?? '/',
    search: to.search ?? '',
    hash: to.hash ?? '',
  });
}

function createSearch(to: To): string {
  const path = stringifyTo(to);

  return path ? `?${encodeURIComponent(path)}` : '';
}

export function queryAdapter(history: History): RouterAdapter {
  return {
    location: extractLocation(history.location),

    push: (to: To) => {
      history.push({
        pathname: history.location.pathname,
        search: createSearch(to),
        hash: history.location.hash,
      });
    },

    replace: (to: To) => {
      history.replace({
        pathname: history.location.pathname,
        search: createSearch(to),
        hash: history.location.hash,
      });
    },

    goBack: () => {
      history.back();
    },

    goForward: () => {
      history.forward();
    },

    listen: (callback) => {
      const unlisten = history.listen(({ location }) =>
        callback(extractLocation(location)),
      );

      return Object.assign(unlisten, {
        unsubscribe: unlisten,
      });
    },
  };
}
