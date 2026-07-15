type CompabilityMode = 'express';

import { tokenizePath } from './tokenize-path';

function convertToExpress(path: string): string {
  const segments = tokenizePath(path);

  if (segments.length === 0) {
    return '/';
  }

  let result = '';
  let previousWasOptional = false;

  for (const segment of segments) {
    if (segment.type === 'literal') {
      result += `/${segment.value}`;
      previousWasOptional = false;
      continue;
    }

    const isWildcard =
      segment.marker === '*' ||
      segment.modifier === '+' ||
      segment.modifier === '*' ||
      segment.range !== undefined;
    const parameter = `${isWildcard ? '*' : ':'}${segment.name}`;

    if (!segment.optional) {
      result += `/${segment.prefix}${parameter}`;
      previousWasOptional = false;
      continue;
    }

    if (segment.prefix) {
      result += `/${segment.prefix}{${parameter}}`;
      previousWasOptional = false;
      continue;
    }

    if (!result) {
      result = `/{${parameter}}`;
    } else if (previousWasOptional) {
      result += `/{/${parameter}}`;
    } else {
      result += `{/${parameter}}`;
    }

    previousWasOptional = true;
  }

  return result;
}

export function convertPath(path: string, mode: CompabilityMode): string {
  switch (mode) {
    case 'express':
      return convertToExpress(path);
  }
}
