export type LiteralPathSegment = {
  type: 'literal';
  value: string;
};

export type ParameterPathSegment = {
  type: 'parameter';
  prefix: string;
  marker: ':' | '*';
  name: string;
  generic?: string;
  range?: string;
  modifier?: '+' | '*';
  optional: boolean;
};

export type PathSegment = LiteralPathSegment | ParameterPathSegment;

function isNameCharacter(character: string | undefined): boolean {
  if (!character) {
    return false;
  }

  const code = character.charCodeAt(0);

  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    code === 95 ||
    (code >= 97 && code <= 122)
  );
}

function findOpeningCharacter(
  value: string,
  cursor: number,
  opening: string,
): number {
  for (let index = cursor - 1; index >= 0; index--) {
    if (value[index] === opening) {
      return index;
    }
  }

  return -1;
}

export function tokenizeSegment(value: string): PathSegment {
  let cursor = value.length;
  let optional = false;
  let modifier: '+' | '*' | undefined;
  let range: string | undefined;
  let generic: string | undefined;

  if (value[cursor - 1] === '?') {
    optional = true;
    cursor--;
  }

  if (value[cursor - 1] === '+' || value[cursor - 1] === '*') {
    modifier = value[cursor - 1] as '+' | '*';
    cursor--;
  }

  if (value[cursor - 1] === '}') {
    const end = cursor - 1;
    const start = findOpeningCharacter(value, end, '{');

    if (start < 0 || start + 1 === end) {
      return { type: 'literal', value };
    }

    range = value.slice(start + 1, end);
    cursor = start;
  }

  if (value[cursor - 1] === '>') {
    const end = cursor - 1;
    const start = findOpeningCharacter(value, end, '<');

    if (start < 0 || start + 1 === end) {
      return { type: 'literal', value };
    }

    generic = value.slice(start + 1, end);
    cursor = start;
  }

  const nameEnd = cursor;

  while (isNameCharacter(value[cursor - 1])) {
    cursor--;
  }

  if (cursor === nameEnd) {
    return { type: 'literal', value };
  }

  const marker = value[cursor - 1];

  if (marker !== ':' && marker !== '*') {
    return { type: 'literal', value };
  }

  return {
    type: 'parameter',
    prefix: value.slice(0, cursor - 1),
    marker,
    name: value.slice(cursor, nameEnd),
    generic,
    range,
    modifier,
    optional,
  };
}

export function tokenizePath(path: string): PathSegment[] {
  return path.split('/').filter(Boolean).map(tokenizeSegment);
}
