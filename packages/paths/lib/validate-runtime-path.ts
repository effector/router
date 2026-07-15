import { tokenizeSegment } from './tokenize-path';

function fail(message: string): never {
  throw new Error(`Path pattern ${message}`);
}

export function validateRuntimePath(path: unknown): asserts path is string {
  if (
    typeof path !== 'string' ||
    !path.startsWith('/') ||
    path.startsWith('//')
  ) {
    fail('must be a pathname starting with "/"');
  }

  if (path.includes('://')) {
    fail('must not contain an origin');
  }

  for (const segment of path.split('/').filter(Boolean)) {
    if (segment.includes('#')) {
      fail('must not contain a query or hash');
    }

    const questionIndex = segment.indexOf('?');
    const parameterLike =
      segment.startsWith(':') ||
      segment.startsWith('*') ||
      segment.includes(':');

    if (questionIndex >= 0 && (!segment.endsWith('?') || !parameterLike)) {
      fail('must not contain a query or hash');
    }

    const body = segment.endsWith('?') ? segment.slice(0, -1) : segment;

    if (!parameterLike) {
      continue;
    }

    const modifiers = body.match(/[+*]+$/)?.[0];

    if (modifiers && modifiers.length > 1) {
      fail('has conflicting modifiers');
    }

    const genericStart = body.indexOf('<');
    const genericEnd = body.lastIndexOf('>');

    if (
      (genericStart >= 0 && genericEnd < genericStart) ||
      (genericStart < 0 && genericEnd >= 0)
    ) {
      fail('has an unclosed generic or range');
    }

    const rangeStart = body.indexOf('{');
    const rangeEnd = body.lastIndexOf('}');

    if (
      (rangeStart >= 0 && rangeEnd < rangeStart) ||
      (rangeStart < 0 && rangeEnd >= 0)
    ) {
      fail('has an unclosed generic or range');
    }

    if (rangeStart >= 0) {
      const range = body.slice(rangeStart + 1, rangeEnd);

      if (!/^\d+,\d+$/.test(range)) {
        fail('has an invalid range');
      }

      const [min, max] = range.split(',').map(Number);

      if (min > max) {
        fail('has an invalid range');
      }
    }

    if (tokenizeSegment(segment).type === 'literal') {
      fail('has an invalid parameter syntax');
    }
  }
}
