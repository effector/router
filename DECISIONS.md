# Decisions

Здесь собраны принятые контракты, которые требуют изменений в runtime, types,
public API или regression tests. Последовательность работ находится в
[TASKS.md](TASKS.md), конкретные дефекты — в [BUGS.md](BUGS.md).

## D1. Семантика query при навигации — принято

`navigate({query})` использует replace-семантику: переданный объект становится
полным query URL. Если поле `query` не передано, текущий query сохраняется при
смене `path`. Пустой объект `query: {}` явно очищает query.

Отдельный `mergeQuery` оператор пока не вводится. Частичное изменение можно
собрать обычной Effector-композицией (`sample`, `combine`, чтение текущего
`$query`) и передать уже полный объект в `navigate`.

Правила для `null`, `undefined` и массивов относятся к D2, чтобы не смешивать
семантику навигации с форматом сериализации.

## D2. Query type, serializer и ownership `trackQuery` — принято

Core хранит узкий URL-совместимый `Query`:
`Record<string, string | null | Array<string | null>>`. Generic serializer в
router API не вводится. Преобразование в числа, даты и другие доменные типы
остаётся на стороне схемы `trackQuery` (например, через Zod `transform`).

`trackQuery` — standalone operator:

```ts
trackQuery({
  controls,
  routes?: Route[],
  parameters,
})
```

`routes` фильтрует tracker по `$isOpened` переданных routes; достаточно, чтобы
был открыт хотя бы один route. Если `routes` не передан, tracker активен всегда.
Метод `router.trackQuery` и поле `check` в новый контракт не входят. Tracker
реактивно проверяет query и активность routes; one-shot сценарии собираются
снаружи обычной Effector-композицией.

`undefined` не является значением query и означает отсутствие ключа, `null`
представляет URL-флаг без значения, массивы сериализуются повторяющимися
ключами. `entered`, `exit`, `ignoreParams` и сохранение unrelated keys при
частичном выходе остаются частью tracker API.

## D3. Route params и identity

### D3.1 Parent params

**Принято: intersection.** Child route получает объединённые params parent и
собственного path. Его `$params`, `Link` и `useLink` используют полный набор;
parent route сохраняет только параметры своего path. Конфликтующие имена
параметров должны быть запрещены на уровне path/type validation.

### D3.2 Pathless и virtual routes

**Принято: единая фабрика.** `createRoute({ path })` возвращает `PathRoute`, а
`createRoute<Params>()` без path возвращает `VirtualRoute` с единым
`RouteOpenedPayload<Params>` payload (`{ params }`). `createVirtualRoute`
остаётся deprecated alias на текущем major и удаляется только в следующем
major. Virtual route не пишет в history и не регистрируется как URL route.

### D3.3 Partial params updates

**Принято: replace.** Каждый `open` содержит полный обязательный набор path
params. Отсутствующие params не читаются из текущего route state и не
подмешиваются автоматически. Partial update собирается снаружи обычной
Effector-композицией, если это требуется конкретному приложению. Для routes
без обязательных params формы `open()`, `open({})` и `open({ params: {} })`
эквивалентны и нормализуются к пустому payload.

### D3.4 Equality и update events

**Принято:** `$params` и `$query` используют value-based equality: порядок
ключей не важен, порядок элементов массива важен, `null` и отсутствие ключа
различаются. Одинаковые значения не создают store update.

`route.updated` обязателен для `PathRoute` и `VirtualRoute` и имеет payload
`RouteOpenedPayload<T>`. Первое открытие вызывает только `opened`; если уже
открытый route получает отличающиеся по значению params, вызывается `updated`.
Унаследованные parent params входят в это сравнение. Одинаковые params и close
не вызывают `updated`. Query-only navigation не считается route update и
наблюдается через `$query`/query tracker. Политика повторной навигации на тот
же URL относится к D4 adapter lifecycle.

## D4. Router и adapter lifecycle

### D4.1 `RouterAdapter.location`

**Принято:** adapter всегда хранит полный синхронный location snapshot
`{ pathname, search, hash }`. `push` и `replace` принимают string или partial
location; omitted поля сохраняются из текущей location. `historyAdapter`
работает с обычным URL, а `queryAdapter` сохраняет host pathname/hash и меняет
только принадлежащую ему query-часть. `back`/`forward` инициируют native
history action, а фактическая новая location приходит через `listen`.

### D4.2 До `setHistory`

**Принято:** `$path` имеет тип `Store<string | null>` и равен `null` до
`setHistory`; `$query` до инициализации равен `{}`. `setHistory` загружает
начальный snapshot adapter. `navigate`, `back` и `forward` до инициализации
завершаются контролируемой ошибкой и не ставятся в очередь. Path routes до
history не активируются, virtual routes могут работать независимо. Повторный
`setHistory` отписывает предыдущий adapter и повторно загружает snapshot.

### D4.3 Дополнительные router events

**Принято:** Router публикует `initialized` и `updated` с payload
`LocationState` (`{ path, query }`). `initialized` срабатывает после каждого
успешного `setHistory`, включая повторную инициализацию после отписки старого
adapter. `updated` срабатывает на последующие изменения нормализованных
`path/query`; одинаковый snapshot и изменение только hash его не вызывают.

### D4.4 `notFound`

**Принято: `notFound` route с propagation.** `createRouter` принимает optional
`notFound` virtual route. Root `notFound` может централизованно обработать
отсутствие match во всём зарегистрированном nested tree. Nested router может
иметь собственный `notFound`; он имеет приоритет в своей зоне. Если локального
fallback нет, отсутствие match поднимается к ближайшему ancestor с
`notFound`. При отсутствии fallback URL не открывает специальный route.

## D5. Язык paths

### D5.1 Optional params

**Принято:** optional parameters имеют type shape `{ id?: string }`, а
отсутствующий параметр не добавляется в runtime parse result. Отдельный codec
для optionality не вводится.

### D5.2 Cardinality

**Принято:** parser и builder используют одни и те же cardinality constraints.
Builder выбрасывает при нарушении границ, parser возвращает `null`. `+`
означает `min: 1`, `*` — `min: 0`, `{min,max}` задаёт явные границы. Modifier
`?` разрешает отсутствующий сегмент, но не отменяет ограничения для
присутствующего значения. Отдельный validation operator не вводится.

### D5.3 Generic syntax и full URL

**Принято:** type-level и runtime одинаково поддерживают `string` по
умолчанию, `number`, literal unions, массивы и cardinality modifiers.
`@effector/router-paths` компилирует только pathname pattern; query, hash,
origin и base path принадлежат router/adapter configuration. Произвольные
generic codecs в paths package не вводятся.

## D6. Общий RouteView tree

### D6.1 Lazy и nested children

**Принято:** lazy и eager RouteView используют один recursive `children`
contract. Lazy importer отвечает только за `view`; `children` сохраняется и
передаётся в `Outlet` на любом уровне. Отдельного one-level API для lazy views
не вводится.

### D6.2 `Outlet` depth

**Принято:** `Outlet` использует recursive context provider на каждом уровне.
Root `createRoutesView` и каждый `Outlet` передают context с children
выбранного RouteView. Ограничение глубины и отдельный one-level contract не
вводятся.

### D6.3 Metadata и layouts

**Принято:** `withLayout` сохраняет `route`, `children` и все существующие
RouteView metadata; wrapper меняет только `view`. Layout identity не входит в
framework-neutral RouteView contract и реализуется binding-specific helper-ом
React/Solid/Vue.

### D6.4 Selection priority и nested Router

**Принято:** сначала отбираются активные views и удаляются parent views, если
активен их child. Среди оставшихся siblings победителем считается последний
объявленный view (declaration order). Open-order state для UI selection не
хранится. `route: Router` считается активным при наличии active routes и
делегирует дальнейший выбор nested tree его собственному binding renderer.

## D7. React `<Link href>`

**Принято:** `href` всегда содержит path, params и query. Interception
применяется только к обычному same-origin `_self` click; `target` не `_self`,
modified clicks и пользовательский `preventDefault` сохраняют native browser
behavior. Native и intercepted navigation используют одну URL-семантику.

## D8. Vue `Link`

**Принято:** Vue `Link` использует exported generic `LinkProps<Params>` с
conditional required params; отдельная `createLink` factory не вводится.
Runtime prop остаётся object, а ограничения Vue template inference описываются
в docs. `query`, `replace`, target, modifiers, `preventDefault`, anchor attrs
и non-`_self` behavior совпадают с контрактом React Link.

## D9. React Native integration

### D9.1 Source of truth

**Принято:** Effector Router — единственный canonical source of truth; React
Navigation рендерит native UI и сообщает пользовательские intents. Native
back, gestures, tab press и deep link переводятся adapter-ом в
controls/route events, после чего Router синхронизирует React Navigation.
`NavigationContainer` остаётся app-owned, binding получает явно переданные
ref/listeners и подавляет echo-loop от собственных Router → RN updates.

От этого зависят adapter/init recipe, deep links, persistence, back/gestures,
cleanup и scopes.

### D9.2 Navigator API

**Принято:** `createStackNavigator` и `createBottomTabsNavigator` возвращают
React component напрямую, без `{ Navigator }` wrapper.

RN screen name — полный зарегистрированный path template, включая parent
segments; Stack и Tabs не преобразуют его и не используют index fallback.
`initialRouteName` использует то же имя и допускается только для route без
required params. Parameterized routes открываются через Router/deep link с
реальными params и запрещены в Bottom Tabs.

`screenOptions` принадлежит navigator config, а `options` — конкретному RN
RouteView. Оба поля используют native React Navigation object/callback types;
navigator передаёт их как есть и не выполняет ручной merge. Stack и Tabs
используют свои option types.
