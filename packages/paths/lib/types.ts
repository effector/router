/* eslint-disable @typescript-eslint/no-unused-vars */

export type ReplaceAll<
  S,
  From extends string,
  To extends string,
> = From extends ''
  ? S
  : S extends `${infer R1}${From}${infer R2}`
    ? `${R1}${To}${ReplaceAll<R2, From, To>}`
    : S;

type Parameter<Name extends string, Payload> = {
  [k in Name]: Payload;
};

type OptionalParameter<Name extends string, Payload> = {
  [k in Name]?: Payload;
};

type WithModificator<
  Type,
  T extends string,
> = T extends `${infer K}{${infer Start},${infer End}}+`
  ? Type[]
  : T extends `${infer K}{${infer Start},${infer End}}*`
    ? Type[]
    : T extends `${infer K}{${infer Start},${infer End}}?`
      ? Type[]
      : T extends `${infer K}{${infer Start},${infer End}}`
        ? Type[]
        : T extends `${infer K}+?`
          ? Type[]
          : T extends `${infer K}*?`
            ? Type[]
            : T extends `${infer K}+`
              ? Type[]
              : T extends `${infer K}*`
                ? Type[]
                : T extends `${infer K}?`
                  ? Type
                  : Type;

type ParameterWithModificator<
  Name extends string,
  Payload,
  Pattern extends string,
> = Pattern extends `${string}?`
  ? OptionalParameter<Name, Payload>
  : Parameter<Name, Payload>;

type WithoutModificator<T extends string> =
  T extends `${infer K}{${infer Start},${infer End}}${infer Modificator}`
    ? K
    : T extends `${infer K}{${infer Start},${infer End}}`
      ? K
      : T extends `${infer K}+?`
        ? K
        : T extends `${infer K}*?`
          ? K
          : T extends `${infer K}?`
            ? K
            : T extends `${infer K}*`
              ? K
              : T extends `${infer K}+`
                ? K
                : T;

type Union<
  T extends string,
  Result = void,
> = T extends `${infer Start}|${infer Type}`
  ? Union<Type, Result extends void ? Start : Result | Start>
  : Result extends void
    ? T
    : Result | T;

type GenericType<T extends string> =
  ReplaceAll<T, ' ', ''> extends infer Trimmed
    ? Trimmed extends `number`
      ? number
      : Trimmed extends `${infer A}|${infer B}`
        ? Union<Trimmed>
        : Trimmed
    : never;

export type UrlParameter<T extends string> =
  T extends `:${infer Name}<${infer Type}>${infer Modificator}`
    ? ParameterWithModificator<
        WithoutModificator<Name>,
        WithModificator<GenericType<Type>, T>,
        T
      >
    : T extends `:${infer Name}<${infer Type}>`
      ? Parameter<Name, GenericType<Type>>
      : T extends `:${infer Name}`
        ? ParameterWithModificator<
            WithoutModificator<Name>,
            WithModificator<string, T>,
            T
          >
        : never;

type WildcardParameter<T extends string> = T extends `${infer Name}?`
  ? OptionalParameter<Name, string[]>
  : Parameter<T, string[]>;

type SegmentParameter<T extends string> = T extends `${string}:${infer Value}`
  ? UrlParameter<`:${Value}`>
  : T extends `${string}*${infer Value}`
    ? WildcardParameter<Value>
    : never;

type AddSegmentParameter<Result, Segment extends string> = [
  SegmentParameter<Segment>,
] extends [never]
  ? Result
  : Result extends void
    ? SegmentParameter<Segment>
    : Result & SegmentParameter<Segment>;

type UrlParams<
  T extends string,
  Result = void,
> = T extends `/${infer Segment}/${infer Route}`
  ? UrlParams<`/${Route}`, AddSegmentParameter<Result, Segment>>
  : T extends `/${infer Segment}`
    ? AddSegmentParameter<Result, Segment>
    : Result;

type Unwrap<Result extends UrlParams<any, void>> = {
  [k in keyof Result]: Result[k];
};

/**
 * @description Extracts the parameters from a URL string.
 * @example ```ts
 * type Params = ParseUrlParams<'/:id/:name'>;
 * //      ^----- { id: string, name: string }
 *
 * type Params = ParseUrlParams<'/:id+'>;
 * //      ^----- { id: string[] }
 *
 * type Params = ParseUrlParams<'/:id*'>;
 * //      ^----- { id: string[] }
 *
 * type Params = ParseUrlParams<'/:id?'>;
 * //      ^----- { id?: string }
 *
 * type Params = ParseUrlParams<'/:id<number>+'>;
 * //      ^----- { id: number[] }
 *
 * type Params = ParseUrlParams<'/:id<number>*'>;
 * //      ^----- { id: number[] }
 *
 * type Params = ParseUrlParams<'/:id<number>'>;
 * //      ^----- { id: number }
 *
 * type Params = ParseUrlParams<'/:id<hello|world>?'>;
 * //      ^----- { id?: 'hello' | 'world' }
 *
 * type Params = ParseUrlParams<'/:id<hello|world>+'>;
 * //      ^----- { id: ('hello' | 'world')[] }
 *
 * type Params = ParseUrlParams<'/'>;
 * //      ^----- void
 * ```
 */
export type ParseUrlParams<T extends string> = Unwrap<UrlParams<T>>;

export type Builder<T> = (params: T) => string;
export type Parser<T> = (path: string) => { path: string; params: T } | null;

interface BaseToken<Type, T = void> {
  type: Type;
  name: string;
  payload: T;
}

export type ConstToken = BaseToken<'const'>;
export type ParameterToken = BaseToken<
  'parameter',
  {
    prefix: string;
    required: boolean;
    genericProps?: { type: 'union'; items: string[] } | { type: 'number' };
    arrayProps?: { min?: number; max?: number };
  }
>;

export type Token = ConstToken | ParameterToken;
