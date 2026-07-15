# ☄️ @effector/router-paths

[![npm](https://img.shields.io/npm/v/@effector/router-paths.svg)](https://www.npmjs.com/package/@effector/router-paths)

Type-safe path parsing and building. Compile a path pattern once into `parse` and `build` functions with fully
inferred parameter types. Used internally by [`@effector/router`](https://www.npmjs.com/package/@effector/router),
and usable standalone — no Effector required.

## Install

```bash
npm install @effector/router-paths
```

## Quick start

```ts
import { compile } from '@effector/router-paths';

const { parse, build } = compile('/user/:id<number>');

parse('/user/123'); // { path: '/user/123', params: { id: 123 } }
parse('/user/abc'); // null — validation failed
build({ id: 456 }); //  '/user/456'  (id is typed as number)
```

## Parameter patterns

```ts
compile('/user/:name'); //             { name: string }   (default)
compile('/post/:id<number>'); //       { id: number }     typed
compile('/edit/:mode<a|b|c>'); //      { mode: 'a'|'b'|'c' } union
compile('/user/:id?'); //              { id?: string }    optional
compile('/tags/:items+'); //           { items: string[] } one or more
compile('/files/:path*'); //           { path: string[] } zero or more
compile('/path/:seg{2,3}'); //         { seg: string[] }  range
```

Modifiers combine: `'/items/:ids<number>{1,3}?'` → `{ ids?: number[] }`.
When an optional parameter is absent, `parse` omits its key from `params`:
`parse('/user')` for `'/user/:id?'` returns `{path: '/user', params: {}}`.
The builder enforces the same cardinality as the parser and throws when a
present array is outside its bounds.
Number and literal-union values are validated before serialization, so the
builder cannot produce a URL that its parser rejects.

Path patterns are pathname-only. Query strings, hashes, origins, malformed
ranges, unclosed generic/range syntax, and conflicting modifiers are rejected
by `compile` with a descriptive error.

## Type extraction

```ts
import { ParseUrlParams } from '@effector/router-paths';

type Params = ParseUrlParams<'/blog/:year<number>/:slug'>;
//   ^- { year: number; slug: string }
```

## Also included

- `convertPath(path, 'express')` — convert patterns to Express-compatible routes.
- Exposed types: `Builder`, `Parser`, `ValidatePath`.

## Documentation

Full guides and API reference: **[router.effector.dev/paths](https://router.effector.dev/paths)**

## License

[MIT](https://github.com/effector/router/blob/main/LICENSE)
