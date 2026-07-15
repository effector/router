import { describe, expect, test } from 'vitest';
import { isEqualQuery, parseQuery, stringifyQuery } from '../lib/query-codec';

describe('query codec', () => {
  test('parses flags, repeated values, empty values, and encoding', () => {
    expect(parseQuery('?flag&tag=one&tag=two&empty=&q=hello%20world')).toEqual({
      flag: null,
      tag: ['one', 'two'],
      empty: '',
      q: 'hello world',
    });
  });

  test('stringifies undefined as absent, null as a flag, and arrays in order', () => {
    expect(
      stringifyQuery({
        removed: undefined,
        flag: null,
        tags: ['first', null, 'last'],
      }),
    ).toBe('flag&tags=first&tags&tags=last');
    expect(stringifyQuery({ empty: [] })).toBe('');
    expect(parseQuery(stringifyQuery({ empty: [] }))).toEqual({});
  });

  test('round-trips values and compares key order independently', () => {
    const query = { flag: null, values: ['one', null, 'two'] };

    expect(parseQuery(stringifyQuery(query))).toEqual(query);
    expect(
      isEqualQuery(query, { values: ['one', null, 'two'], flag: null }),
    ).toBe(true);
    expect(
      isEqualQuery(query, { flag: null, values: ['two', null, 'one'] }),
    ).toBe(false);
    expect(isEqualQuery(query, { flag: undefined as never })).toBe(false);
  });

  test('encodes reserved characters without changing repeated-value order', () => {
    const query = { q: 'a & b', values: ['one/two', 'three?'] };

    expect(parseQuery(stringifyQuery(query))).toEqual(query);
  });
});
