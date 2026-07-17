import queryString from 'query-string';
import type { Query, QueryInput } from './types';

/** Parse a URL search string into the router's URL-compatible Query value. */
export function parseQuery(search: string): Query {
  return { ...queryString.parse(search) } as Query;
}

/**
 * Serialize a Query input without a leading `?`.
 * `undefined` omits a key, `null` is a flag, and arrays use repeated keys.
 */
export function stringifyQuery(query: QueryInput): string {
  return queryString.stringify(query);
}

function isEqualQueryValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!Array.isArray(left) || !Array.isArray(right)) return false;

  return (
    left.length === right.length &&
    left.every((value, index) => isEqualQueryValue(value, right[index]))
  );
}

/** Compare Query values independent of object key order. */
export function isEqualQuery(left: Query, right: Query): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key) => key in right && isEqualQueryValue(left[key], right[key]),
    )
  );
}
