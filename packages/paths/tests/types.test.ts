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

type IsEqual<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false;

type AllTrue<Values extends readonly boolean[]> =
  Exclude<Values[number], true> extends never ? true : false;

type TestsUnion = 'hello' | 'world';

type ParseMatrix = [
  IsEqual<ParseUrlParams<'/:id'>, { id: string }>,
  IsEqual<ParseUrlParams<'/:id?'>, { id?: string }>,
  IsEqual<ParseUrlParams<'/:id*'>, { id: string[] }>,
  IsEqual<ParseUrlParams<'/:id+'>, { id: string[] }>,
  IsEqual<ParseUrlParams<'/:id<string>'>, { id: 'string' }>,
  IsEqual<ParseUrlParams<'/:id<number>'>, { id: number }>,
  IsEqual<ParseUrlParams<'/:id<hello|world>'>, { id: TestsUnion }>,
  IsEqual<ParseUrlParams<'/:id<string>?'>, { id?: 'string' }>,
  IsEqual<ParseUrlParams<'/:id<number>?'>, { id?: number }>,
  IsEqual<ParseUrlParams<'/:id<hello|world>?'>, { id?: TestsUnion }>,
  IsEqual<ParseUrlParams<'/:id<string>*'>, { id: 'string'[] }>,
  IsEqual<ParseUrlParams<'/:id<number>*'>, { id: number[] }>,
  IsEqual<ParseUrlParams<'/:id<hello|world>*'>, { id: TestsUnion[] }>,
  IsEqual<ParseUrlParams<'/:id<string>+'>, { id: 'string'[] }>,
  IsEqual<ParseUrlParams<'/:id<number>+'>, { id: number[] }>,
  IsEqual<ParseUrlParams<'/:id<hello|world>+'>, { id: TestsUnion[] }>,
  IsEqual<ParseUrlParams<'/:id{1,2}'>, { id: string[] }>,
  IsEqual<ParseUrlParams<'/:id<number>{1,2}'>, { id: number[] }>,
  IsEqual<ParseUrlParams<'/:id<string>{1,2}'>, { id: 'string'[] }>,
  IsEqual<ParseUrlParams<'/:id<hello|world>{1,2}'>, { id: TestsUnion[] }>,
  IsEqual<ParseUrlParams<'/:id<number>{1,2}?'>, { id?: number[] }>,
  IsEqual<ParseUrlParams<'/:id<string>{1,2}?'>, { id?: 'string'[] }>,
  IsEqual<ParseUrlParams<'/:id<hello|world>{1,2}?'>, { id?: TestsUnion[] }>,
  IsEqual<ParseUrlParams<'/:id<number>{1,2}*'>, { id: number[] }>,
  IsEqual<ParseUrlParams<'/:id<string>{1,2}*'>, { id: 'string'[] }>,
  IsEqual<ParseUrlParams<'/:id<hello|world>{1,2}*'>, { id: TestsUnion[] }>,
  IsEqual<ParseUrlParams<'/:id<number>{1,2}+'>, { id: number[] }>,
  IsEqual<ParseUrlParams<'/:id<string>{1,2}+'>, { id: 'string'[] }>,
  IsEqual<ParseUrlParams<'/:id<hello|world>{1,2}+'>, { id: TestsUnion[] }>,
  IsEqual<ParseUrlParams<'/:id<number>'>, { id: number }>,
  IsEqual<ParseUrlParams<'/:id<hello| world >'>, { id: TestsUnion }>,
];

expectTypeOf<AllTrue<ParseMatrix>>().toEqualTypeOf<true>();

type IsInvalid<Path extends string> =
  ValidatePath<Path> extends ['invalid', string] ? true : false;

type ValidateMatrix = [
  IsEqual<ValidatePath<'/:id'>, '/:id'>,
  IsEqual<ValidatePath<'/:id?'>, '/:id?'>,
  IsEqual<ValidatePath<'/:id*'>, '/:id*'>,
  IsEqual<ValidatePath<'/:id+'>, '/:id+'>,
  IsEqual<ValidatePath<'/:id<string>'>, '/:id<string>'>,
  IsEqual<ValidatePath<'/:id<number>'>, '/:id<number>'>,
  IsEqual<ValidatePath<'/:id<hello|world>'>, '/:id<hello|world>'>,
  IsEqual<ValidatePath<'/:id<string>?'>, '/:id<string>?'>,
  IsEqual<ValidatePath<'/:id<number>?'>, '/:id<number>?'>,
  IsEqual<ValidatePath<'/:id<hello|world>?'>, '/:id<hello|world>?'>,
  IsEqual<ValidatePath<'/:id<string>*'>, '/:id<string>*'>,
  IsEqual<ValidatePath<'/:id<number>*'>, '/:id<number>*'>,
  IsEqual<ValidatePath<'/:id<hello|world>*'>, '/:id<hello|world>*'>,
  IsEqual<ValidatePath<'/:id<string>+'>, '/:id<string>+'>,
  IsEqual<ValidatePath<'/:id<number>+'>, '/:id<number>+'>,
  IsEqual<ValidatePath<'/:id<hello|world>+'>, '/:id<hello|world>+'>,
  IsEqual<ValidatePath<'/:id{1,2}'>, '/:id{1,2}'>,
  IsEqual<ValidatePath<'/:id<number>{1,2}'>, '/:id<number>{1,2}'>,
  IsEqual<ValidatePath<'/:id<string>{1,2}'>, '/:id<string>{1,2}'>,
  IsEqual<ValidatePath<'/:id<hello|world>{1,2}'>, '/:id<hello|world>{1,2}'>,
  IsEqual<ValidatePath<'/:id<number>{1,2}?'>, '/:id<number>{1,2}?'>,
  IsEqual<ValidatePath<'/:id<string>{1,2}?'>, '/:id<string>{1,2}?'>,
  IsEqual<ValidatePath<'/:id<hello|world>{1,2}?'>, '/:id<hello|world>{1,2}?'>,
  IsEqual<ValidatePath<'/:id<number>{1,2}*'>, '/:id<number>{1,2}*'>,
  IsEqual<ValidatePath<'/:id<string>{1,2}*'>, '/:id<string>{1,2}*'>,
  IsEqual<ValidatePath<'/:id<hello|world>{1,2}*'>, '/:id<hello|world>{1,2}*'>,
  IsEqual<ValidatePath<'/:id<number>{1,2}+'>, '/:id<number>{1,2}+'>,
  IsEqual<ValidatePath<'/:id<string>{1,2}+'>, '/:id<string>{1,2}+'>,
  IsEqual<ValidatePath<'/:id<hello|world>{1,2}+'>, '/:id<hello|world>{1,2}+'>,
  IsEqual<
    ValidatePath<'/:id<hello|world>{err,err}+'>,
    ['invalid', '/:id<hello|world>{number,number}+']
  >,
  IsEqual<
    ValidatePath<'/:id<hello|world>{1,err}'>,
    ['invalid', '/:id<hello|world>{1,number}']
  >,
  IsEqual<
    ValidatePath<'/:id<hello|world>{err,1}+'>,
    ['invalid', '/:id<hello|world>{number,1}+']
  >,
  IsInvalid<'/profile?tab=posts'>,
  IsInvalid<'/profile#details'>,
  IsInvalid<'https://example.com/profile'>,
  IsInvalid<'/profile/:id<'>,
  IsInvalid<'/profile/:id{3,2}'>,
  IsInvalid<'/profile/:id+*'>,
];

expectTypeOf<AllTrue<ValidateMatrix>>().toEqualTypeOf<true>();
