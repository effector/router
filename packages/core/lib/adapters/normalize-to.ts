import { parsePath } from 'history';
import type { RouterLocation, To } from './types';

/** Resolve a string or partial target against the adapter's current location. */
export function normalizeTo(current: RouterLocation, to: To): RouterLocation {
  if (to === '') {
    return { pathname: '/', search: '', hash: '' };
  }

  if (typeof to === 'string') {
    const parsed = parsePath(to);

    return {
      pathname: parsed.pathname || current.pathname,
      search: to.includes('?') ? parsed.search || '' : current.search,
      hash: to.includes('#') ? parsed.hash || '' : current.hash,
    };
  }

  return {
    pathname: to.pathname ?? current.pathname,
    search: to.search ?? current.search,
    hash: to.hash ?? current.hash,
  };
}
