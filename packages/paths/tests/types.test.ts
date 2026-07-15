import { expectTypeOf, test } from 'vitest';
import type { ParseUrlParams } from '../lib';

test('optional parameters are optional object properties', () => {
  expectTypeOf<ParseUrlParams<'/user/:id?'>>().toEqualTypeOf<{
    id?: string;
  }>();

  expectTypeOf<ParseUrlParams<'/@:user?'>>().toEqualTypeOf<{
    user?: string;
  }>();

  expectTypeOf<ParseUrlParams<'/name-:user?'>>().toEqualTypeOf<{
    user?: string;
  }>();

  type OptionalArrayParams = ParseUrlParams<'/files/:ids<number>{1,3}?'>;

  expectTypeOf<OptionalArrayParams>().toEqualTypeOf<{
    ids?: number[];
  }>();

  expectTypeOf<ParseUrlParams<'/files/*path?'>>().toEqualTypeOf<{
    path?: string[];
  }>();
});
