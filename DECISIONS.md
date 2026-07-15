# Decisions

Здесь собраны развилки, которые требуют продуктового или архитектурного
решения. Для каждого пункта нужно выбрать вариант, после чего соответствующие
работы переходят в [TASKS.md](TASKS.md). Конкретные воспроизводимые дефекты
находятся в [BUGS.md](BUGS.md).

## D1. Семантика query при навигации

**Вопрос:** что означает `navigate({query})` и аналогичный payload route/link?

- **Replace:** переданный query становится полным query URL. Поведение
  предсказуемо и совпадает с текущей сериализацией, но для частичного изменения
  нужно явно прочитать текущий query.
- **Merge:** переданные ключи накладываются на текущий query. Удобнее для UI,
  но сложнее для удаления ключей, повторяемости и nested routers.
- **Два явных оператора:** базовый `navigate` делает replace, а отдельный
  `mergeQuery` выражает частичное изменение.

Нужно также определить, сохраняется ли текущий query при `navigate({path})` и
какие правила применяются к `null`, `undefined` и массивам.

## D2. Query type, serializer и ownership `trackQuery`

**Вопрос:** где находится каноническая модель query и кто владеет синхронизацией?

- Узкий core type: `string | null | Array<string | null>` и mapping внутри
  `trackQuery`.
- Generic serializer-backed type: application передаёт codec с round-trip
  guarantees для number, dates и сложных объектов.
- Гибрид: core хранит строковую модель, а mapping/serializer остаётся
  application operator.

Отдельно нужно выбрать ownership:

- оставить `router.trackQuery` как facade;
- добавить standalone `trackQuery`/`syncQuery` operators;
- оставить оба уровня, но определить migration и приоритет.

Нужно зафиксировать `entered`, `exit`, `ignoreParams`, unrelated query keys,
`replace` policy и mapping non-primitive values.

## D3. Route params и identity

### D3.1 Parent params

- **Intersection:** child route получает params parent и собственного path. URL
  и types совпадают, но generic inference становится сложнее.
- **Child-only:** сохранить текущую простоту типов и требовать явный payload
  parent на уровне router/application.

### D3.2 Pathless и virtual routes

- Разрешить standalone `createRoute().open()` как UI state.
- Считать pathless `createRoute` только route-моделью, которая открывается
  через registration/history.
- Рекомендовать `createVirtualRoute` для standalone UI state и оставить
  pathless `createRoute` только для mapped URL routes.

### D3.3 Partial params updates

- **Replace:** каждый open содержит полный обязательный набор path params.
- **Merge:** отсутствующие params берутся из текущего route state.
- **Builder-level merge:** merge разрешён только через отдельный operator, а
  `route.open` остаётся полным payload.

### D3.4 Equality и update events

Нужно выбрать shallow/deep/value equality для `$params`, `$query` и `route.updated`,
а также решить, является ли повторная навигация на тот же URL observable event.

## D4. Router и adapter lifecycle

### D4.1 `RouterAdapter.location`

- Adapter всегда хранит полную синхронную location snapshot.
- Partial object targets нормализуются в core.
- Каждый adapter сам определяет fallback для omitted pathname/search/hash.

Нужно выбрать один контракт для `historyAdapter` и `queryAdapter`, включая
состояние после `push`, `replace`, `back` и `forward`.

### D4.2 До `setHistory`

- Публичный `$path: Store<string | null>`.
- Реальный initial path из router configuration.
- Ошибка при чтении navigation state до инициализации.

### D4.3 Дополнительные router events

Нужно решить, нужны ли публичные `initialized` и `updated`, их payload,
повторный `setHistory` и поведение nested routers.

### D4.4 External URLs и not-found

- External URL — отдельный target/operator, которым управляет adapter.
- External URL — обычная string navigation с escape hatch на уровне adapter.
- Not-found — route, event/callback или результат match; отдельно определить
  nested-router propagation.

## D5. Язык paths

### D5.1 Optional params

- Type shape `{id?: string}` и parse result `{}`.
- Type shape `{id: string | undefined}` и parse result `{id: undefined}`.
- Разделить compile-time optionality и runtime parse result отдельным codec.

### D5.2 Cardinality

- Builder валидирует `+` и ranges и выбрасывает при нарушении границ.
- Cardinality проверяется только parser-ом; builder принимает подготовленные
  значения.
- Ограничения переносятся в отдельный validation operator.

### D5.3 Generic syntax и full URL

Нужно выбрать, какие named generics поддерживаются одинаково в TS/runtime
(`string`, `number`, union и т.д.), а также компилирует ли paths package только
pathname или full URL с origin/base.

## D6. Общий RouteView tree

### D6.1 Lazy и nested children

- Lazy views обязаны сохранять тот же recursive `children` contract, что и eager
  views.
- Lazy views ограничиваются одним уровнем, а `children` удаляется из public API.

### D6.2 `Outlet` depth

- Recursive context provider на каждом уровне.
- Явное ограничение одним уровнем с более узким type contract.

### D6.3 Metadata и layouts

- `withLayout` сохраняет все RouteView metadata и children.
- `withLayout` получает узкий transform contract и не обещает сохранение дерева.
- Shared layout identity относится к общему RouteView API или к каждому binding
  отдельно.

### D6.4 Selection priority и nested Router

- Declaration order определяет победивший view.
- Фактический open order определяет победивший view.
- Сначала filtering parent/child, затем declaration/open priority.

Нужно также определить, одинаково ли `route: Router` работает для eager/lazy
views в React, Solid и Vue.

## D7. React API

### D7.1 `useRouter`

- Оставить текущий Effector unit shape:
  `{query, path, activeRoutes, onBack, onForward, onNavigate}`.
- Вернуть router object со stores/events и именами `$path`, `$query`, `back`,
  `forward`, `navigate`, как в части документации.
- Предоставить два явно разных hooks для unit shape и router object.

### D7.2 `useLink`

- `onOpen` остаётся raw event, а params передаются явно в `onOpen({params})`.
- Hook возвращает handler, захвативший переданные params/query.

### D7.3 Native `<Link href>`

- `href` всегда содержит path, params и query, чтобы native navigation совпадала
  с intercepted click.
- Native modified clicks считаются отдельным browser behavior, а docs сужают
  обещание эквивалентности.

## D8. Vue API и provider boundary

### D8.1 `RouterProvider`

- Provider обязателен для всех views, links и composables, с runtime validation.
- Provider нужен только context consumers (`useRouter`, `useLink`, `Link`), а
  unit-based APIs работают без него.

### D8.2 Vue `Link`

Нужно выбрать реальный type/runtime contract для `params`:

- применить exported conditional `LinkProps` к компоненту;
- сохранить optional `any` params и честно описать это в docs.

Одновременно нужно закрепить `query`, `replace`, `target`, modifiers,
`preventDefault`, anchor attrs и non-`_self` behavior.

## D9. React Native integration

### D9.1 Source of truth

- React Navigation владеет native stack/tabs, Router подписывается на native
  actions.
- Effector Router — source of truth, React Navigation получает commands через
  owned ref/container.
- Двусторонняя модель с явными reconciliation rules.

От этого зависят adapter/init recipe, deep links, persistence, back/gestures,
cleanup и scopes.

### D9.2 Navigator API

- Factory возвращает component напрямую.
- Factory возвращает `{Navigator}`.

Нужно также выбрать ownership `screenOptions`, deterministic screen names,
`initialRouteName`, per-route options и правила parameterized tabs.

## D10. Application-layer policies

### D10.1 Scroll restoration

- Core behavior.
- Binding helper.
- Application integration recipe на базе router lifecycle.

### D10.2 Route errors

- Core публикует error state/event.
- Binding предоставляет error boundary/page primitive.
- Application сама связывает preparation Effect с error route/page.

Эти решения не должны вводить второй transition/task/barrier API в core.
