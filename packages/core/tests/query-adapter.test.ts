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
});
