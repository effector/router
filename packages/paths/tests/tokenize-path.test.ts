import { describe, expect, test } from 'vitest';
import { tokenizePath } from '../lib/tokenize-path';

describe('tokenize path', () => {
  test('parses literals and parameter metadata', () => {
    expect(tokenizePath('/files/:id<number>{1,2}?')).toStrictEqual([
      { type: 'literal', value: 'files' },
      {
        type: 'parameter',
        prefix: '',
        marker: ':',
        name: 'id',
        generic: 'number',
        range: '1,2',
        modifier: undefined,
        optional: true,
      },
    ]);
  });

  test('parses parameters embedded in a segment', () => {
    expect(tokenizePath('/@:user/name-:name?')).toStrictEqual([
      {
        type: 'parameter',
        prefix: '@',
        marker: ':',
        name: 'user',
        generic: undefined,
        range: undefined,
        modifier: undefined,
        optional: false,
      },
      {
        type: 'parameter',
        prefix: 'name-',
        marker: ':',
        name: 'name',
        generic: undefined,
        range: undefined,
        modifier: undefined,
        optional: true,
      },
    ]);
  });

  test('keeps malformed and adversarial segments literal', () => {
    const missingGenericEnd = '*0<'.repeat(10_000);
    const missingRangeEnd = '{{'.repeat(10_000);

    expect(tokenizePath(`/${missingGenericEnd}`)).toStrictEqual([
      { type: 'literal', value: missingGenericEnd },
    ]);
    expect(tokenizePath(`/${missingRangeEnd}`)).toStrictEqual([
      { type: 'literal', value: missingRangeEnd },
    ]);
  });
});
