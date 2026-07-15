import { createMemoryHistory } from 'history';
import { describe, expect, test } from 'vitest';
import { historyAdapter, queryAdapter } from '../lib';

describe('historyAdapter location', () => {
  test('always reflects the current history snapshot', () => {
    const history = createMemoryHistory({
      initialEntries: ['/start?tab=one#top'],
    });
    const adapter = historyAdapter(history);

    expect(adapter.location).toMatchObject({
      pathname: '/start',
      search: '?tab=one',
      hash: '#top',
    });

    adapter.push('/next?tab=two#middle');
    expect(adapter.location).toMatchObject({
      pathname: '/next',
      search: '?tab=two',
      hash: '#middle',
    });

    adapter.replace('/final?tab=three#bottom');
    expect(adapter.location).toMatchObject({
      pathname: '/final',
      search: '?tab=three',
      hash: '#bottom',
    });

    history.push('/native?tab=four#native');
    expect(adapter.location).toMatchObject({
      pathname: '/native',
      search: '?tab=four',
      hash: '#native',
    });
  });
});

describe('queryAdapter', () => {
  test('location reflects push, replace, and native history updates', () => {
    const history = createMemoryHistory({ initialEntries: ['/host'] });
    const adapter = queryAdapter(history);

    adapter.push('/nested?tab=one#top');
    expect(adapter.location).toEqual({
      pathname: '/nested',
      search: '?tab=one',
      hash: '#top',
    });

    adapter.replace('/nested?tab=two#middle');
    expect(adapter.location).toEqual({
      pathname: '/nested',
      search: '?tab=two',
      hash: '#middle',
    });

    history.push('/host?%2Fnative%3Ftab%3Dthree%23native');
    expect(adapter.location).toEqual({
      pathname: '/native',
      search: '?tab=three',
      hash: '#native',
    });
  });

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

  describe('named key mode', () => {
    test('stores the nested route in the configured query parameter', () => {
      const history = createMemoryHistory({ initialEntries: ['/users'] });
      const adapter = queryAdapter(history, { key: 'modal' });

      adapter.push('/user/1');

      expect(history.location.pathname).toBe('/users');
      expect(history.location.search).toBe('?modal=%2Fuser%2F1');
    });

    test('extracts the nested route from the configured query parameter', () => {
      const history = createMemoryHistory({
        initialEntries: ['/users?modal=%2Fuser%2F1'],
      });

      expect(queryAdapter(history, { key: 'modal' }).location).toEqual({
        pathname: '/user/1',
        search: '',
        hash: '',
      });
    });

    test('preserves other query parameters when pushing', () => {
      const history = createMemoryHistory({
        initialEntries: ['/users?sort=asc'],
      });
      const adapter = queryAdapter(history, { key: 'modal' });

      adapter.push('/user/1');

      const params = new URLSearchParams(history.location.search);
      expect(params.get('sort')).toBe('asc');
      expect(params.get('modal')).toBe('/user/1');
    });

    test('ignores unrelated query parameters when extracting', () => {
      const history = createMemoryHistory({
        initialEntries: ['/users?sort=asc'],
      });

      expect(queryAdapter(history, { key: 'modal' }).location).toEqual({
        pathname: '/',
        search: '',
        hash: '',
      });
    });

    test('empty target removes only the configured parameter', () => {
      const history = createMemoryHistory({
        initialEntries: ['/users?sort=asc&modal=%2Fuser%2F1'],
      });
      const adapter = queryAdapter(history, { key: 'modal' });

      adapter.push('');

      const params = new URLSearchParams(history.location.search);
      expect(params.get('sort')).toBe('asc');
      expect(params.has('modal')).toBe(false);
    });

    test('round-trips nested search and hash through the parameter', () => {
      const history = createMemoryHistory({ initialEntries: ['/users'] });
      const adapter = queryAdapter(history, { key: 'modal' });

      adapter.push('/user/1?tab=info#top');

      expect(queryAdapter(history, { key: 'modal' }).location).toEqual({
        pathname: '/user/1',
        search: '?tab=info',
        hash: '#top',
      });
    });

    test('two query routers with different keys coexist on one history', () => {
      const history = createMemoryHistory({ initialEntries: ['/users'] });
      const modal = queryAdapter(history, { key: 'modal' });
      const tab = queryAdapter(history, { key: 'tab' });

      modal.push('/user/1');
      tab.push('/analytics');

      // both keys live side by side
      const params = new URLSearchParams(history.location.search);
      expect(params.get('modal')).toBe('/user/1');
      expect(params.get('tab')).toBe('/analytics');

      // each adapter reads only its own route
      expect(queryAdapter(history, { key: 'modal' }).location.pathname).toBe(
        '/user/1',
      );
      expect(queryAdapter(history, { key: 'tab' }).location.pathname).toBe(
        '/analytics',
      );

      // closing one leaves the other intact
      modal.push('');
      const after = new URLSearchParams(history.location.search);
      expect(after.has('modal')).toBe(false);
      expect(after.get('tab')).toBe('/analytics');
    });
  });

  describe('combined with historyAdapter', () => {
    test('a pathname router and a query router share one history', () => {
      const history = createMemoryHistory({ initialEntries: ['/'] });
      const main = historyAdapter(history);
      const modal = queryAdapter(history, { key: 'modal' });

      // main router owns the pathname
      main.push({ pathname: '/about' });
      expect(history.location.pathname).toBe('/about');

      // modal layers on top without touching the pathname
      modal.push('/user/1');
      expect(history.location.pathname).toBe('/about');
      expect(new URLSearchParams(history.location.search).get('modal')).toBe(
        '/user/1',
      );

      // each adapter reads only its own concern from the shared location
      expect(historyAdapter(history).location.pathname).toBe('/about');
      expect(queryAdapter(history, { key: 'modal' }).location.pathname).toBe(
        '/user/1',
      );
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
