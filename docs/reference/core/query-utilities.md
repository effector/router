# Query utilities

`@effector/router` exports helpers for parsing, serializing, and comparing the
same URL-compatible query values used by router navigation.

## API

```ts
import {
  isEqualQuery,
  parseQuery,
  stringifyQuery,
  type Query,
  type QueryInput,
} from '@effector/router';

function parseQuery(search: string): Query;
function stringifyQuery(query: QueryInput): string;
function isEqualQuery(left: Query, right: Query): boolean;
```

`QueryValue` is `string | null | Array<string | null>`. `Query` maps keys to
`QueryValue`; `QueryInput` additionally allows `undefined` so a key can be
omitted while serializing.

## `parseQuery`

`parseQuery` converts a URL search string into a `Query` value. Repeated keys
become ordered arrays and flags become `null`.

```ts
const query = parseQuery('?tag=router&tag=effector&enabled');

// {
//   tag: ['router', 'effector'],
//   enabled: null,
// }
```

## `stringifyQuery`

`stringifyQuery` serializes a `QueryInput` without a leading `?`. `null` is a
flag, arrays use repeated keys, and `undefined` omits a key.

```ts
const search = stringifyQuery({
  tag: ['router', 'effector'],
  enabled: null,
  page: undefined,
});

// 'enabled&tag=router&tag=effector'
```

The ordering of serialized keys follows the underlying query serializer; do not
use the resulting string to test query equality.

## `isEqualQuery`

`isEqualQuery` compares two normalized `Query` values. Object key order does
not affect equality; array order does.

```ts
isEqualQuery(
  { tag: ['router', 'effector'], enabled: null },
  { enabled: null, tag: ['router', 'effector'] },
); // true

isEqualQuery({ tag: ['router', 'effector'] }, { tag: ['effector', 'router'] }); // false
```

## See also

- [createRouterControls](/core/create-router-controls) - navigate with query values
- [trackQuery](/core/track-query) - validate and react to selected query values
- [Adapters](/core/adapters) - synchronize query values with history
