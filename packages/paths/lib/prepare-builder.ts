import { Builder, Token } from './types';

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
          const { prefix } = token.payload;

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
