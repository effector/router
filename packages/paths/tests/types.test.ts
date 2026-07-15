import { expectTypeOf, test } from 'vitest';
import type { ParseUrlParams, ValidatePath } from '../lib';

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

  expectTypeOf<ParseUrlParams<'/files/:ids+?'>>().toEqualTypeOf<{
    ids?: string[];
  }>();

  expectTypeOf<ParseUrlParams<'/files/:ids*?'>>().toEqualTypeOf<{
    ids?: string[];
  }>();

  expectTypeOf<ValidatePath<'/profile'>>().toEqualTypeOf<'/profile'>();
  expectTypeOf<ValidatePath<'/profile?tab=posts'>>().toMatchTypeOf<
    ['invalid', string]
  >();
  expectTypeOf<ValidatePath<'/profile/:id<'>>().toMatchTypeOf<
    ['invalid', string]
  >();
  expectTypeOf<ValidatePath<'/profile/:id+*'>>().toMatchTypeOf<
    ['invalid', string]
  >();
  expectTypeOf<ValidatePath<'/profile/:id{3,2}'>>().toMatchTypeOf<
    ['invalid', string]
  >();
});
