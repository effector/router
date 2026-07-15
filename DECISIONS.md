# Decisions

This file contains accepted contracts that still require runtime, type, public
API, or regression-test changes. Implementation tasks are intentionally not
duplicated here: they are derived from each decision, augmented with findings
from the current code audit, and ranked in [TASKS.md](TASKS.md). Execution rules
are defined in [IMPLEMENTATION_RULES.md](IMPLEMENTATION_RULES.md). Concrete
defects belong in [BUGS.md](BUGS.md).

## Implementation map

| Decision                      | Stage and tasks                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------- |
| D1. Query navigation          | [Stage 5, T24–T25 and T29](TASKS.md#5-query-navigation-and-tracking--d1d2)       |
| D2. Query type and trackQuery | [Stage 5, T24 and T26–T29](TASKS.md#5-query-navigation-and-tracking--d1d2)       |
| D3.1. Parent params           | [Stage 2, T10 and T12](TASKS.md#2-unified-route-model--d3)                       |
| D3.2. Pathless/virtual routes | [Stage 2, T06–T08 and T12](TASKS.md#2-unified-route-model--d3)                   |
| D3.3. Params replacement      | [Stage 2, T09 and T12](TASKS.md#2-unified-route-model--d3)                       |
| D3.4. Equality/updated        | [Stage 2, T11–T12](TASKS.md#2-unified-route-model--d3)                           |
| D4.1. Adapter location        | [Stage 3, T13–T15 and T19](TASKS.md#3-adapter-and-router-lifecycle--d41d43)      |
| D4.2. Before setHistory       | [Stage 3, T16–T17 and T19](TASKS.md#3-adapter-and-router-lifecycle--d41d43)      |
| D4.3. Router events           | [Stage 3, T18–T19](TASKS.md#3-adapter-and-router-lifecycle--d41d43)              |
| D4.4. notFound                | [Stage 4, T20–T23](TASKS.md#4-router-matching-and-not-found-propagation--d44)    |
| D5.1. Optional params         | [Stage 1, T01 and T05](TASKS.md#1-path-language-foundation--d5)                  |
| D5.2. Cardinality             | [Stage 1, T02 and T05](TASKS.md#1-path-language-foundation--d5)                  |
| D5.3. Generics/pathname-only  | [Stage 1, T03–T05](TASKS.md#1-path-language-foundation--d5)                      |
| D6.1. Lazy children           | [Stage 7, T37–T38](TASKS.md#7-recursive-routeview-tree-and-layouts--d6)          |
| D6.2. Outlet depth            | [Stage 7, T35 and T38](TASKS.md#7-recursive-routeview-tree-and-layouts--d6)      |
| D6.3. Metadata/layouts        | [Stage 7, T33, T36 and T38](TASKS.md#7-recursive-routeview-tree-and-layouts--d6) |
| D6.4. Selection/nested Router | [Stage 7, T34–T35 and T38](TASKS.md#7-recursive-routeview-tree-and-layouts--d6)  |
| D7. React Link                | [Stage 8, T39–T41 and T44](TASKS.md#8-web-link-and-uselink-parity--d7d8)         |
| D8. Vue Link                  | [Stage 8, T39–T40 and T43–T44](TASKS.md#8-web-link-and-uselink-parity--d7d8)     |
| D9.1. RN source of truth      | [Stage 9, T45 and T48–T51](TASKS.md#9-react-native-integration--d9)              |
| D9.2. RN navigator API        | [Stage 9, T46–T47 and T50–T51](TASKS.md#9-react-native-integration--d9)          |

Cross-cutting conformance work is tracked in stages 6 and 10 and closes only
after the contracts it depends on are stable.

## D1. Query navigation semantics — accepted

`navigate({ query })` uses replacement semantics: the provided object becomes
the complete URL query. When `query` is omitted, navigation to another `path`
preserves the current query. An explicit empty object, `query: {}`, clears it.

No separate `mergeQuery` operator is introduced. Partial updates are composed
with ordinary Effector primitives (`sample`, `combine`, and the current
`$query`) before passing a complete object to `navigate`.

Rules for `null`, `undefined`, and arrays belong to D2 so navigation semantics
remain separate from serialization format.

## D2. Query type, serializer, and `trackQuery` ownership — accepted

Core stores a narrow URL-compatible `Query`:
`Record<string, string | null | Array<string | null>>`. The router API does not
introduce a generic serializer. Conversion to numbers, dates, and other domain
types belongs to the `trackQuery` schema, for example through a Zod transform.

`trackQuery` is a standalone operator:

```ts
trackQuery({
  controls,
  routes?: Route[],
  parameters,
})
```

`routes` filters the tracker by the supplied routes' `$isOpened` stores. At
least one route must be open. When `routes` is omitted, the tracker is always
active. The new contract does not include a `router.trackQuery` method or a
`check` field. The tracker reacts to query and route activity changes. One-shot
scenarios are composed externally with ordinary Effector primitives.

`undefined` is not a query value and means that a key is absent. `null`
represents a URL flag without a value. Arrays use repeated keys. `entered`,
`exit`, `ignoreParams`, and preservation of unrelated keys during a partial
exit remain part of the tracker API.

## D3. Route params and identity

### D3.1 Parent params

**Accepted: intersection.** A child route receives the union of its parent's
params and its own path params. Its `$params`, `Link`, and `useLink` use the
complete set. The parent route stores only params declared by its own path.
Conflicting param names must be rejected by path/type validation.

### D3.2 Pathless and virtual routes

**Accepted: one factory.** `createRoute({ path })` returns `PathRoute`, while
`createRoute<Params>()` without a path returns `VirtualRoute` with the same
`RouteOpenedPayload<Params>` payload (`{ params }`). `createVirtualRoute`
remains a deprecated alias during the current major and is removed only in the
next major. A virtual route does not write history and is not registered as a
URL route.

### D3.3 Partial params updates

**Accepted: replacement.** Every `open` contains the complete required set of
path params. Missing params are not read from current route state or merged
automatically. An application that needs a partial update composes it externally
with ordinary Effector primitives. For routes without required params,
`open()`, `open({})`, and `open({ params: {} })` are equivalent and normalize to
an empty payload.

### D3.4 Equality and update events

**Accepted:** `$params` and `$query` use value-based equality. Object key order
does not matter; array element order does. `null` and an absent key are
different. Equal values do not produce a store update.

`route.updated` is required on `PathRoute` and `VirtualRoute` and carries
`RouteOpenedPayload<T>`. The first activation emits only `opened`. When an
already open route receives value-different params, it emits `updated`.
Inherited parent params participate in the comparison. Equal params and close
do not emit `updated`. Query-only navigation is not a route update and is
observed through `$query` or a query tracker. Repeated navigation to the same URL
belongs to the D4 adapter lifecycle.

## D4. Router and adapter lifecycle

### D4.1 `RouterAdapter.location`

**Accepted:** an adapter always stores a complete synchronous location snapshot
`{ pathname, search, hash }`. `push` and `replace` accept a string or a partial
location. Omitted fields retain their current values. `historyAdapter` works
with a normal URL. `queryAdapter` retains the host pathname/hash and changes
only the query section it owns. `back` and `forward` initiate native history
actions; the actual new location arrives through `listen`.

### D4.2 Before `setHistory`

**Accepted:** `$path` has type `Store<string | null>` and is `null` before
`setHistory`; `$query` is `{}` before initialization. `setHistory` loads the
adapter's initial snapshot. Calling `setHistory` again unsubscribes the previous
adapter and reloads the new snapshot.

`navigate`, `back`, and `forward` before initialization emit one public failure
event. Router and its controls expose the same Effector unit:

```ts
type NavigationFailure =
  | {
      operation: 'navigate';
      reason: 'not-initialized';
      payload: NavigatePayload;
    }
  | {
      operation: 'back' | 'forward';
      reason: 'not-initialized';
    };

controls.navigationFailed: Event<NavigationFailure>;
router.navigationFailed: Event<NavigationFailure>;
```

The event is emitted synchronously in the command's Effector transaction. It
stays in the calling Fork API scope; `allSettled(command, { scope })` resolves
after scoped subscribers have observed the failure. The command does not throw,
write a console diagnostic, enter `beforeNavigate`, or create a queue. History,
location stores, and path-route state remain unchanged. A path route's `open`
fails through the same `navigate` branch, while virtual routes continue to work
independently. `navigationFailed` covers only a command issued without an
initialized adapter; failures from an attached adapter are outside this event.

### D4.3 Additional router events

**Accepted:** Router publishes `initialized` and `updated`, both carrying
`LocationState` (`{ path, query }`). `initialized` fires after every successful
`setHistory`, including reinitialization after the old adapter is detached.
`updated` fires for later normalized path/query changes. An equal snapshot or a
hash-only change does not emit it.

### D4.4 `notFound`

**Accepted: a propagating `notFound` route.** `createRouter` accepts an optional
virtual `notFound` route. A root `notFound` can centrally handle a missing match
across the registered nested tree. A nested router may define its own
`notFound`, which takes priority in its subtree. Without a local fallback, the
missing match propagates to the nearest ancestor with `notFound`. Without any
fallback, the URL does not activate a special route.

## D5. Path language

### D5.1 Optional params

**Accepted:** optional parameters have type shape `{ id?: string }`. An absent
parameter is omitted from the runtime parse result. No separate optionality
codec is introduced.

### D5.2 Cardinality

**Accepted:** parser and builder apply the same cardinality constraints. The
builder throws when a bound is violated; the parser returns `null`. `+` means
`min: 1`, `*` means `min: 0`, and `{min,max}` declares explicit bounds. The `?`
modifier allows an absent segment but does not remove constraints from a
present value. No separate validation operator is introduced.

### D5.3 Generic syntax and full URLs

**Accepted:** type-level and runtime behavior support the same syntax: `string`
by default, `number`, literal unions, arrays, and cardinality modifiers.
`@effector/router-paths` compiles pathname patterns only. Query, hash, origin,
and base path belong to router/adapter configuration. The paths package does
not introduce arbitrary generic codecs.

## D6. Shared RouteView tree

### D6.1 Lazy and nested children

**Accepted:** lazy and eager RouteView use one recursive `children` contract. A
lazy importer is responsible only for `view`; `children` are retained and
provided to `Outlet` at every level. No separate one-level lazy API is
introduced.

### D6.2 `Outlet` depth

**Accepted:** `Outlet` uses a recursive context provider at every level. Root
`createRoutesView` and each `Outlet` provide a context containing the selected
RouteView's children. No depth limit or separate one-level contract is
introduced.

### D6.3 Metadata and layouts

**Accepted:** `withLayout` preserves `route`, `children`, and all existing
RouteView metadata; the wrapper changes only `view`. Layout identity does not
belong to the framework-neutral RouteView contract and is implemented by a
binding-specific helper in React, Solid, and Vue.

### D6.4 Selection priority and nested Router

**Accepted:** select active views first, then remove a parent view when its child
is active. Among remaining siblings, the last declared view wins. UI selection
does not store open-order state. `route: Router` is active when it contains
active routes and delegates further selection of its nested tree to that
router's binding renderer.

## D7. React `<Link href>`

**Accepted:** `href` always contains path, params, and query. Interception
applies only to an ordinary same-origin `_self` click. A non-`_self` target,
modified click, or user `preventDefault` keeps native browser behavior. Native
and intercepted navigation use the same URL semantics.

## D8. Vue `Link`

**Accepted:** Vue `Link` uses an exported generic `LinkProps<Params>` with
conditional required params. No separate `createLink` factory is introduced.
The runtime prop remains an object. Vue template-inference limitations are
documented. `query`, `replace`, target, modifiers, `preventDefault`, anchor
attributes, and non-`_self` behavior match the React Link contract.

## D9. React Native integration

### D9.1 Source of truth

**Accepted:** Effector Router is the only canonical source of truth. React
Navigation renders native UI and reports user intent. Native back, gestures,
tab presses, and deep links are translated by the binding into controls/route
events, then Router synchronizes React Navigation. `NavigationContainer`
remains app-owned. Router creation and `controls.setHistory(...)` remain
application configuration; the binding does not create a Router or attach a
history adapter.

The navigator component receives the app-owned container ref through one prop:

```ts
type NativeNavigatorProps<ParamList extends ParamListBase = ParamListBase> = {
  navigationRef: NavigationContainerRefWithCurrent<ParamList>;
};

interface NativeNavigator {
  <ParamList extends ParamListBase = ParamListBase>(
    props: NativeNavigatorProps<ParamList>,
  ): React.ReactElement;
}
```

The application creates the ref with React Navigation, passes the same ref to
`NavigationContainer` and the returned navigator component, and retains full
ownership of the container's `onReady` and `onStateChange` props. The binding
does not add a public bridge object, callback pair, or normalized native-intent
unit.

On mount, the component subscribes to the ref's native `ready` and `state`
events, then checks `isReady()` so an already-fired readiness transition is not
missed. `ready` has no payload. `state` keeps React Navigation's native event
payload; because it may contain partial state, the binding treats it as a signal
and reads the complete snapshot through `getRootState()` and
`getCurrentRoute()`. Before readiness, no React Navigation command is sent and
no command queue is created; readiness synchronizes only the latest Router
state. Screen `focus`, `beforeRemove`, completed transition/gesture, and
`tabPress` listeners retain their native payload types and are normalized
privately to existing route/control units. The debugging-only
`__unsafe_action__` event is not used.

All ref listeners and Effector watchers are removed on unmount. Watchers and
native callbacks bind to the Effector scope in which the navigator is rendered.
Binding-originated Router-to-RN updates are marked privately and suppressed when
the corresponding native notification returns.

Adapter initialization, deep links, persistence, back/gestures, cleanup, and
scopes depend on this decision.

### D9.2 Navigator API

**Accepted:** `createStackNavigator` and `createBottomTabsNavigator` return a
`NativeNavigator` directly, without a `{ Navigator }` wrapper. The returned
component requires the `navigationRef` prop defined by D9.1.

An RN screen name is the complete registered path template, including parent
segments. Stack and Tabs do not transform it and do not use an index fallback.
`initialRouteName` uses the same name and is allowed only for a route without
required params. Parameterized routes open through Router/deep links with real
params and are forbidden in Bottom Tabs.

`screenOptions` belongs to navigator config, while `options` belongs to one RN
RouteView. Both use native React Navigation object/callback types. The navigator
passes them through without manually merging them. Stack and Tabs use their own
option types.
