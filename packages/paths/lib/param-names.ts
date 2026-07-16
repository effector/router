import { tokenizePath } from './tokenize-path';

/**
 * Names of every parameter declared by a pathname pattern, in order. This is
 * the single source of truth for param-name extraction — consumers must not
 * re-implement it with ad-hoc regexes, so the paths grammar (embedded params,
 * generics, cardinality, optionals) stays owned by the tokenizer.
 *
 * @example getParamNames('/users/:userId/posts/:postId') // ['userId', 'postId']
 */
export function getParamNames(pattern: string): string[] {
  const names: string[] = [];

  for (const segment of tokenizePath(pattern)) {
    if (segment.type === 'parameter') {
      names.push(segment.name);
    }
  }

  return names;
}

/**
 * Names of the parameters a pattern requires — every parameter that is not
 * marked optional with a trailing `?`. Useful for callers that must reject
 * parameterized targets (for example React Navigation `initialRouteName`).
 *
 * @example getRequiredParamNames('/users/:id/:tab?') // ['id']
 */
export function getRequiredParamNames(pattern: string): string[] {
  const names: string[] = [];

  for (const segment of tokenizePath(pattern)) {
    if (segment.type === 'parameter' && !segment.optional) {
      names.push(segment.name);
    }
  }

  return names;
}
