type CompabilityMode = 'express';

type ConvertedSegment = {
  prefix: string;
  parameter?: string;
  optional: boolean;
};

function convertSegment(segment: string): ConvertedSegment {
  const parameter = segment.match(
    /^(.*?)([:*])([a-zA-Z0-9_]+)(?:<[^>]+>)?(?:[+*]|\{[^}]+\})?(\?)?$/,
  );

  if (!parameter) {
    return { prefix: segment, optional: false };
  }

  const [, prefix, marker, name, optional] = parameter;
  const isWildcard = marker === '*' || /(?:[+*]|\{[^}]+\})/.test(segment);

  return {
    prefix,
    parameter: `${isWildcard ? '*' : ':'}${name}`,
    optional: Boolean(optional),
  };
}

function convertToExpress(path: string): string {
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 0) {
    return '/';
  }

  let result = '';
  let previousWasOptional = false;

  for (const segment of segments) {
    const converted = convertSegment(segment);

    if (!converted.parameter) {
      result += `/${converted.prefix}`;
      previousWasOptional = false;
      continue;
    }

    if (!converted.optional) {
      result += `/${converted.prefix}${converted.parameter}`;
      previousWasOptional = false;
      continue;
    }

    if (converted.prefix) {
      result += `/${converted.prefix}{${converted.parameter}}`;
      previousWasOptional = false;
      continue;
    }

    if (!result) {
      result = `/{${converted.parameter}}`;
    } else if (previousWasOptional) {
      result += `/{/${converted.parameter}}`;
    } else {
      result += `{/${converted.parameter}}`;
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
