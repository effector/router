# Bugs

Набор наблюдаемых дефектов и type/runtime gaps. Вопросы, где нужно выбрать
публичный контракт, вынесены в [DECISIONS.md](DECISIONS.md). Последовательность
исправлений и документационных работ находится в [TASKS.md](TASKS.md).

## Core и paths

### B1. Навигация без fork scope теряется (#56)

В обычном global scope `scopeBind` внутри `openRoutesByPathFx` может выбросить
ошибку, которая тихо поглощается. Навигация не доходит до route state. Нужен
явный error path и regression test для global scope.

### B2. `build` отбрасывает валидные falsy params

Проверка через truthiness пропускает `0` и пустую строку. Например,
`build({id: 0})` строит URL без `id`. Проверка должна отличать только
`null`/`undefined` от валидных значений.

### B3. `convertPath` распознаёт только параметр `id`

Regex в конвертере зашит на имя `id`, поэтому документированные формы
`:path+`, `:version?` и `*path?` не преобразуются для произвольных имён.

### B4. Optional ranges не согласованы в parser

Комбинации вроде `:ids<number>{1,3}?` документированы как optional, но
отсутствующий сегмент всё ещё проверяется как range с обязательным минимумом.
Нужны absent/present tests и исправление parser либо удаление неподдержанного
сочетания из документации.

### B5. Parent params теряются в типах дочерних routes (#23)

Child route выводит параметры только своего сегмента, хотя URL требует также
параметры parent. Из-за этого `Link`/`useLink` и route state требуют casts.

### B6. `VirtualRoute` не совместим с binding API

`createVirtualRoute`, `group` и `chainRoute` возвращают `VirtualRoute`, а часть
Solid/shared helpers принимает только `Route | Router`. Отличия payload
`open` и `$params` вынуждают consumers использовать casts.

### B7. Повторные одинаковые значения параметров создают лишние обновления

`route.$params` может эмитить обновление, когда значения фактически не
изменились. Связанный `route.updated` также не имеет согласованной value-based
deduplication. Точная equality-политика вынесена в [D3](DECISIONS.md#d3-route-params-и-идентичность).

## RouteView и links

### B8. Lazy RouteView теряет `children` (#70)

React lazy binding возвращает только `{route, view}`, хотя тип и документация
разрешают nested `children`. Родительский lazy view после этого не может
передать дерево в `Outlet`.

### B9. `withLayout` теряет nested metadata

Bindings преобразуют view к `{route, view}` и удаляют `children` и будущие поля
RouteView. Wrapped parent теряет свою вложенную композицию.

### B10. `Link.href` не содержит query

Rendered anchor строится из path и params, а query добавляется только в click
handler. Copy-link, native preview, modified clicks и `target="_blank"` видят
неполный URL.

## React Native

### B11. Router state не синхронизируется с React Navigation (#71)

Создаваемый `navigationRef` не подключён к реальному `NavigationContainer` или
navigator, поэтому Router → native navigation не доходит до UI.

### B12. Native actions не возвращаются в Router (#72)

Back, gestures, tab presses и другие React Navigation actions не формируют
обратный поток в Effector Router.

### B13. Nested RouteView children не участвуют в RN navigator (#73)

React Native navigator не определяет, как `children` и `Outlet` входят в общий
RouteView tree.

### B14. `initialRouteName` расходится с generated screen names (#74)

Navigator преобразует `/home` в `home`, а docs и options используют `/home`.
Из-за этого initial screen может не находиться.

### B15. Dynamic `screenOptions` не совпадает с типами (#75)

Документация показывает callback и per-screen options, тогда как declarations и
runtime принимают другую форму и повторно применяют один global object.

## Binding API gaps

### B16. Active-link styling отсутствует в Solid `Link`

Solid `Link` прокидывает anchor props, но не предоставляет active state или
`activeClass`. Нужно либо добавить API, либо явно зафиксировать отсутствие
такой возможности как binding policy.
