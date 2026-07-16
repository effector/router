import { describe, expect, test } from 'vitest';
import { getParamNames, getRequiredParamNames } from '../lib';
import { tokenizePath } from '../lib/tokenize-path';

// The tokenizer owns the path grammar. This suite guards that `getParamNames`
// stays derived from it, so consumers (core `createRoute`, RN screen naming)
// never drift back to ad-hoc regexes. Each pattern's names must equal the
// parameter tokens the tokenizer produces.
const patterns = [
  '/',
  '/user/:id',
  '/users/:userId/posts/:postId',
  '/user/:id<number>',
  '/files/:path*',
  '/@:user',
  '/name-:user',
  '/:a-:b',
  '/files/:id<number>{1,2}?',
  // Adversarial: a colon inside the generic must not be read as a parameter.
  '/x/:filter<foo:bar>',
] as const;

describe('getParamNames', () => {
  test.each(patterns)('agrees with the tokenizer for %s', (pattern) => {
    const expected = tokenizePath(pattern)
      .filter((segment) => segment.type === 'parameter')
      .map((segment) => segment.name);

    expect(getParamNames(pattern)).toStrictEqual(expected);
  });

  test('extracts ordered names across segments', () => {
    expect(getParamNames('/users/:userId/posts/:postId')).toStrictEqual([
      'userId',
      'postId',
    ]);
  });

  test('a generic value containing a colon yields one name', () => {
    // A naive `[:*][A-Za-z0-9_]+` regex would wrongly extract `bar`.
    expect(getParamNames('/x/:filter<foo:bar>')).toStrictEqual(['filter']);
  });
});

describe('getRequiredParamNames', () => {
  test('excludes optional (`?`) parameters only', () => {
    expect(getRequiredParamNames('/users/:id/:tab?')).toStrictEqual(['id']);
    expect(getRequiredParamNames('/name-:user?')).toStrictEqual([]);
    expect(getRequiredParamNames('/user/:id')).toStrictEqual(['id']);
  });
});
