import { createMemoryHistory } from 'history';
import { describe, expect, test } from 'vitest';
import { queryAdapter } from '../lib';

describe('queryAdapter', () => {
  test('does not throw on empty search', () => {
    const history = createMemoryHistory({
      initialEntries: ['/users'],
    });

    expect(() => queryAdapter(history)).not.toThrow();

    expect(queryAdapter(history).location).toEqual({
      pathname: '/',
      search: '',
      hash: '',
    });
  });

  test('pushes route into current location search', () => {
    const history = createMemoryHistory({
      initialEntries: ['/users'],
    });

    const adapter = queryAdapter(history);

    adapter.push({
      pathname: '/user/1',
    });

    expect(history.location.pathname).toBe('/users');
    expect(history.location.search).toBe('?%2Fuser%2F1');
  });

  test('extracts route from location search', () => {
    const history = createMemoryHistory({
      initialEntries: ['/users?%2Fuser%2F1'],
    });

    const adapter = queryAdapter(history);

    expect(adapter.location).toEqual({
      pathname: '/user/1',
      search: '',
      hash: '',
    });
  });

  describe('To contract', () => {
    test('string To is treated as a full path (history convention)', () => {
      const history = createMemoryHistory({ initialEntries: ['/users'] });
      const adapter = queryAdapter(history);

      adapter.push('/user/1?foo=bar');

      // main URL is preserved, nested path is packed into the query
      expect(history.location.pathname).toBe('/users');
      expect(history.location.search).toBe(
        `?${encodeURIComponent('/user/1?foo=bar')}`,
      );

      expect(extract(history)).toEqual({
        pathname: '/user/1',
        search: '?foo=bar',
        hash: '',
      });
    });

    test('string To and equivalent object To are indistinguishable', () => {
      const fromString = pushed('/user/1?foo=bar#top');
      const fromObject = pushed({
        pathname: '/user/1',
        search: '?foo=bar',
        hash: '#top',
      });

      expect(fromString).toEqual(fromObject);
    });

    test('nested hash round-trips into the extracted location', () => {
      const history = createMemoryHistory({ initialEntries: ['/users'] });
      const adapter = queryAdapter(history);

      adapter.push('/user/1#top');

      expect(extract(history)).toEqual({
        pathname: '/user/1',
        search: '',
        hash: '#top',
      });
    });

    test('empty target clears the search regardless of To shape', () => {
      expect(pushed('').search).toBe('');
      expect(pushed({}).search).toBe('');
    });

    test('push preserves the host pathname and hash', () => {
      const history = createMemoryHistory({ initialEntries: ['/users#main'] });
      const adapter = queryAdapter(history);

      adapter.push({ pathname: '/user/1' });

      expect(history.location.pathname).toBe('/users');
      expect(history.location.hash).toBe('#main');
    });

    test('replace behaves like push for the To contract', () => {
      const history = createMemoryHistory({ initialEntries: ['/users'] });
      const adapter = queryAdapter(history);

      adapter.replace('/user/1?foo=bar');

      expect(history.location.pathname).toBe('/users');
      expect(extract(history)).toEqual({
        pathname: '/user/1',
        search: '?foo=bar',
        hash: '',
      });
    });
  });
});

// Reads back what queryAdapter would expose for the current history location.
function extract(history: ReturnType<typeof createMemoryHistory>) {
  return queryAdapter(history).location;
}

// Pushes `to` onto a fresh history and returns the resulting host location
// (only the contract-relevant fields; `key`/`state` are history internals).
function pushed(to: Parameters<ReturnType<typeof queryAdapter>['push']>[0]) {
  const history = createMemoryHistory({ initialEntries: ['/users'] });
  queryAdapter(history).push(to);
  const { pathname, search, hash } = history.location;
  return { pathname, search, hash };
}
