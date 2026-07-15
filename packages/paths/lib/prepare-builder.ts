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

          if (value === null || value === undefined) {
            continue;
          }

          if (Array.isArray(value)) {
            for (const param of value) {
              result.push(param.toString());
            }
          } else {
            result.push(value.toString());
          }

          break;
        }
      }
    }

    return `/${result.join('/')}`;
  };
}
