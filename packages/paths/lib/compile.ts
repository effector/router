import { prepareParser } from './prepare-parser';
import { ParameterToken, ParseUrlParams, Token } from './types';
import { prepareBuilder } from './prepare-builder';
import { tokenizePath } from './tokenize-path';
import { validateRuntimePath } from './validate-runtime-path';

function removeWhitespace(value: string): string {
  let result = '';

  for (const character of value) {
    if (
      character !== ' ' &&
      character !== '\t' &&
      character !== '\n' &&
      character !== '\r' &&
      character !== '\f' &&
      character !== '\v'
    ) {
      result += character;
    }
  }

  return result;
}

function parseRange(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parts = value.split(',');

  if (parts.length !== 2 || parts.some((part) => part.length === 0)) {
    return null;
  }

  for (const part of parts) {
    for (const character of part) {
      if (character < '0' || character > '9') {
        return null;
      }
    }
  }

  return { min: Number(parts[0]), max: Number(parts[1]) };
}

/**
 * @param path Route path
 * @description compiles route and give two functions: build (from params to string) & parse (validate from string and get params)
 * @returns { build: Builder<Params>; parse: Parser<Params>; }
 * @example ```ts
 * import { compile } from '@effector/router-paths';
 *
 * // without params
 * const { parse, build } = compile('/profile');
 *
 * console.log(parse('/profile')) // { path: '/profile', params: null }
 * console.log(parse('/test')) // null
 *
 * console.log(build()) // '/profile'
 *
 * // with params
 * const { parse, build } = compile('/:id');
 *
 * console.log(parse('/johndoe')) // { path: '/profile', params: { id: 'johndoe' } }
 * console.log(parse('/')) // null
 *
 * console.log(build({ id: 'johndoe' })) // '/johndoe'
 * ```
 */
export function compile<T extends string, Params = ParseUrlParams<T>>(path: T) {
  validateRuntimePath(path);

  const tokens: Token[] = [];

  for (const segment of tokenizePath(path)) {
    if (segment.type === 'literal') {
      tokens.push({ type: 'const', name: segment.value, payload: undefined });
      continue;
    }

    const token: ParameterToken = {
      type: 'parameter',
      name: segment.name,
      payload: {
        prefix: segment.prefix,
        required: !segment.optional,
      },
    };

    const generic = segment.generic
      ? removeWhitespace(segment.generic)
      : undefined;

    if (generic === 'number') {
      token.payload.genericProps = { type: 'number' };
    }

    if (generic?.includes('|')) {
      token.payload.genericProps = {
        type: 'union',
        items: generic.split('|'),
      };
    }

    if (segment.marker === '*') {
      token.payload.arrayProps = { min: 1 };
    }

    switch (segment.modifier) {
      case '*': {
        token.payload.arrayProps = {};
        break;
      }
      case '+': {
        token.payload.arrayProps = { min: 1 };
        break;
      }
    }

    const range = parseRange(segment.range);

    if (range) {
      token.payload.arrayProps = {
        ...token.payload.arrayProps,
        ...range,
      };
    }

    tokens.push(token);
  }

  return {
    /**
     * @param input Input path
     * @returns `{ path: string; params: Params }` | `null`
     */
    parse: prepareParser<Params>(tokens),
    /**
     * @param params Route parameters
     * @returns string
     */
    build: prepareBuilder<Params>(tokens),
  };
}
