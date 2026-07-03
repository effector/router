import { createPath, parsePath, type History } from 'history';
import type { RouterAdapter, RouterLocation, To } from './types';

export interface QueryAdapterOptions {
  /**
   * When set, the nested route is stored in a single query parameter with this
   * name (e.g. `?modal=%2Fuser%2F1`), leaving every other query parameter on
   * the host URL untouched. When omitted, the adapter owns the whole
   * `location.search`, storing the nested route as a single URL-encoded path
   * (e.g. `?%2Fuser%2F1`) and cannot coexist with other query parameters.
   */
  key?: string;
}

interface Strategy {
  extract: (location: History['location']) => RouterLocation;
  search: (currentSearch: string, to: To) => string;
}

function emptyLocation(): RouterLocation {
  return {
    pathname: '/',
    search: '',
    hash: '',
  };
}

/** Serializes a navigation target to a full path (`history` convention). */
function toPath(to: To): string {
  if (typeof to === 'string') {
    return to;
  }

  return createPath({
    pathname: to.pathname ?? '/',
    search: to.search ?? '',
    hash: to.hash ?? '',
  });
}

/** Parses a nested route path back into a full location. */
function parseNestedPath(value: string): RouterLocation {
  const { pathname, search, hash } = parsePath(value);

  return {
    pathname: pathname ?? '/',
    search: search ?? '',
    hash: hash ?? '',
  };
}

/**
 * Reads and writes the nested route in a single named query parameter,
 * preserving all other query parameters on the host URL.
 */
function keyedStrategy(key: string): Strategy {
  return {
    extract(location) {
      const value = new URLSearchParams(location.search).get(key);

      return value ? parseNestedPath(value) : emptyLocation();
    },

    search(currentSearch, to) {
      const params = new URLSearchParams(currentSearch);
      const path = toPath(to);

      if (path && path !== '/') {
        params.set(key, path);
      } else {
        params.delete(key);
      }

      const search = params.toString();

      return search ? `?${search}` : '';
    },
  };
}

/**
 * Owns the whole `location.search`, storing the nested route as a single
 * URL-encoded path. Cannot coexist with other query parameters.
 */
function wholeSearchStrategy(): Strategy {
  return {
    extract(location) {
      const raw = location.search.startsWith('?')
        ? location.search.slice(1)
        : location.search;

      return raw ? parseNestedPath(decodeURIComponent(raw)) : emptyLocation();
    },

    search(_currentSearch, to) {
      const path = toPath(to);

      return path && path !== '/' ? `?${encodeURIComponent(path)}` : '';
    },
  };
}

export function queryAdapter(
  history: History,
  options: QueryAdapterOptions = {},
): RouterAdapter {
  const strategy = options.key
    ? keyedStrategy(options.key)
    : wholeSearchStrategy();

  const navigate = (to: To) => ({
    pathname: history.location.pathname,
    search: strategy.search(history.location.search, to),
    hash: history.location.hash,
  });

  return {
    location: strategy.extract(history.location),

    push: (to: To) => {
      history.push(navigate(to));
    },

    replace: (to: To) => {
      history.replace(navigate(to));
    },

    goBack: () => {
      history.back();
    },

    goForward: () => {
      history.forward();
    },

    listen: (callback) => {
      const unlisten = history.listen(({ location }) =>
        callback(strategy.extract(location)),
      );

      return Object.assign(unlisten, {
        unsubscribe: unlisten,
      });
    },
  };
}
