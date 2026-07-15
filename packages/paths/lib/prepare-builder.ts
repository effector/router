import { Builder, Token } from './types';

function validateValuePresence(
  name: string,
  value: unknown,
  required: boolean,
) {
  if (value === null || value === undefined) {
    if (required) {
      throw new Error(`Parameter "${name}" expects a value`);
    }

    return;
  }

  const values = Array.isArray(value) ? value : [value];

  for (const item of values) {
    if (item === null || item === undefined || String(item).trim() === '') {
      if (required || Array.isArray(value)) {
        throw new Error(`Parameter "${name}" expects a value`);
      }
    }
  }
}

function validateGeneric(
  name: string,
  value: unknown,
  required: boolean,
  genericProps: { type: 'union'; items: string[] } | { type: 'number' },
) {
  if (value === null || value === undefined) {
    if (required) {
      throw new Error(`Parameter "${name}" expects a valid value`);
    }

    return;
  }

  const values = Array.isArray(value) ? value : [value];

  for (const item of values) {
    if (item === null || item === undefined) {
      throw new Error(`Parameter "${name}" expects a valid value`);
    }

    const raw = String(item).trim();

    if (!raw) {
      if (required || Array.isArray(value)) {
        throw new Error(`Parameter "${name}" expects a valid value`);
      }

      continue;
    }

    if (genericProps.type === 'number') {
      if (isNaN(+raw)) {
        throw new Error(`Parameter "${name}" expects a number`);
      }

      continue;
    }

    if (!genericProps.items.includes(raw)) {
      throw new Error(
        `Parameter "${name}" expects one of: ${genericProps.items.join(', ')}`,
      );
    }
  }
}

function validateCardinality(
  name: string,
  value: unknown,
  required: boolean,
  arrayProps: { min?: number; max?: number },
) {
  if (value === null || value === undefined) {
    if (!required) {
      return;
    }
  }

  const length =
    value === null || value === undefined
      ? 0
      : Array.isArray(value)
        ? value.length
        : 1;
  const min = arrayProps.min ?? 0;
  const max = arrayProps.max ?? Infinity;

  if (length >= min && length <= max) {
    return;
  }

  const description =
    min > 0 && max < Infinity
      ? `between ${min} and ${max}`
      : min > 0
        ? `at least ${min}`
        : `at most ${max}`;

  const noun =
    (min === 1 && max === Infinity) || (min === 0 && max === 1)
      ? 'value'
      : 'values';

  throw new Error(`Parameter "${name}" expects ${description} ${noun}`);
}

export function prepareBuilder<T>(tokens: Token[]): Builder<T> {
  return (params: any) => {
    const result: string[] = [];

    if (tokens.length === 0) {
      return '/';
    }

    for (const token of tokens) {
      switch (token.type) {
        case 'const': {
          result.push(token.name);
          break;
        }
        case 'parameter': {
          const value = params?.[token.name];
          const { arrayProps, prefix, required } = token.payload;

          if (arrayProps) {
            validateCardinality(token.name, value, required, arrayProps);
          }

          validateValuePresence(token.name, value, required);

          if (token.payload.genericProps) {
            validateGeneric(
              token.name,
              value,
              required,
              token.payload.genericProps,
            );
          }

          if (value === null || value === undefined) {
            if (prefix) {
              result.push(prefix);
            }

            continue;
          }

          if (Array.isArray(value)) {
            if (value.length === 0 && prefix) {
              result.push(prefix);
            }

            for (let index = 0; index < value.length; index++) {
              const param = value[index].toString();
              result.push(index === 0 ? `${prefix}${param}` : param);
            }
          } else {
            result.push(`${prefix}${value.toString()}`);
          }

          break;
        }
      }
    }

    return `/${result.join('/')}`;
  };
}
