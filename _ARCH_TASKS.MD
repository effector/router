# Architecture, behavior, and documentation tasks

Единый дедуплицированный чеклист по аудитам `core`, `paths`, React, React Native, Solid и Vue, а также по всем открытым GitHub issues на 2026-07-15. Пакетные `_DOCS_TASKS_*.md` остаются подробными исходными отчётами.

Принцип группировки: пункты в разделе документации не требуют изменения публичного контракта. Всё, где возможны несколько долгосрочных вариантов поведения, находится в группе соответствующего архитектурного решения.

## Однозначные исправления поведения

Эти дефекты не требуют выбора нового публичного контракта.

- [ ] `[paths]` Сохранять валидные falsy params при `build`: проверять только `null`/`undefined`, чтобы `{ id: 0 }` не превращался в `/post`.
- [ ] `[paths]` Обобщить `convertPath` на произвольные имена параметров; сейчас regex ошибочно зашит на `id`, поэтому документированные `:path+`, `:version?` и `*path?` не преобразуются.
- [ ] #56 [Bug]: routes never open without a fork scope - scopeBind throws inside openRoutesByPathFx and is silently swallowed — не допускать тихой потери навигации в обычном global scope и добавить regression test.

## Архитектурные решения

### Решение 1. Граница ответственности router core и UI/application layer

Нужно решить, должен ли core управлять UI-политиками или только публиковать lifecycle-сигналы, на которых bindings/app строят scroll, error pages и layout preservation.

- [ ] #30 Reset scroll on history change — определить, является ли scroll restoration функцией core, binding helper или примером application-level integration.
- [ ] #31 Show error page when an effect fails on the page — определить представление route error и владельца error UI.
- [ ] #57 RFC: preserve shared layout instances across `withLayout` route transitions — решить, входит ли layout identity/preservation в общий RouteView-контракт или остаётся binding-specific для React, Solid и Vue.

### Решение 2. Модель route: path, parent params, pathless/virtual routes и value-based updates

Нужно закрепить одну модель идентичности и состояния route: откуда берутся параметры, что можно открыть вручную, когда route считается обновлённым и по какому equality.

- [ ] #23 Docs: nested routes with params propagation — решить, входят ли params родительского пути в тип и payload child route; затем синхронно обновить `createRoute` types, runtime, docs и тест с param только у parent.
- [ ] `[core/react]` Определить различие pathless `createRoute()` и `createVirtualRoute()`: допускается ли standalone `open/close` для первого или документация должна везде использовать virtual route/registered path.
- [ ] #34 RFC: Allow partial Route params updates — определить merge/replace semantics, обязательность path params и способ перестроения URL.
- [ ] #43 `route.$params` triggers whenever values of params actually not changed — выбрать и документировать equality для params stores.
- [ ] #62 route.updated event with value-based deduplication — согласовать событие с equality `$params`, `$query` и повторной навигацией на тот же URL.

### Решение 3. Query-модель и направление синхронизации

Нужно определить канонический `Query`, сериализацию, merge/replace semantics и границы ответственности `trackQuery`. Решение должно одинаково работать в controls, router и bindings.

- [ ] `[core]` Решить, заменяет ли `navigate.query` весь query или сливается с текущим; затем привести guide и regression tests к одному поведению.
- [ ] `[core]` Выбрать канонический `Query`: текущий `Record<string, string | null | Array<string | null>>`, более широкий scalar model или generic serializer-backed model; удалить numeric-примеры, если они не поддерживаются.
- [ ] `[core]` Зафиксировать lifecycle `trackQuery`: когда срабатывает `entered`, какие ключи очищает `exit`, как сохраняются unrelated params и что означает `ignoreParams`.
- [ ] #28 Allow replace (not push) when trackQuery updates the query — выбрать history policy и способ её конфигурации.
- [ ] #35 Re-evaluate: prevent trackQuery from triggering unrelated chains — определить dependency/equality semantics, чтобы изменение чужих query keys не запускало несвязанные chains.
- [ ] #40 trackQuery: read/write mapping for non-primitive query params — решить, является ли mapping частью schema, serializer или отдельным operator.
- [ ] #65 Custom query serializer for createRouterControls / createRouter — определить точку расширения, типы и round-trip guarantees.
- [ ] #66 Standalone trackQuery / syncQuery operators, deprecate router.trackQuery method — определить финальную ownership-модель query sync и migration path.

### Решение 4. Контракт navigation target, adapter initialization и router lifecycle

Нужно определить допустимые targets и состояния до/после инициализации: обязательность query, актуальность `adapter.location`, внешние URL, not-found и публичные lifecycle events/types.

- [ ] `[core]` Зафиксировать контракт `RouterAdapter.location`, fallback для partial object targets и одинаковое поведение `historyAdapter`/`queryAdapter` после push/replace.
- [ ] `[core]` Выбрать pre-initialization state `$path`: публичный `string | null` либо реальный начальный path вместо cast `null as string`.
- [ ] `[core]` Определить публичность `PathRoute`, `PathlessRoute`, `RouterControls`, `LocationState`, `To`, `Subscription` и adapter options; экспортировать поддержанные типы либо убрать внутренние имена из reference.
- [ ] #37 Support navigating to external URLs — определить отдельный target/escape hatch, adapter responsibility и browser/native behavior.
- [ ] #63 router.initialized and router.updated lifecycle events — определить точные моменты, payload и поведение при повторном `setHistory`.
- [ ] #64 routeNotFound option in createRouter — решить, является ли not-found route, callback/event или результат match, включая nested routers.

### Решение 5. Язык путей: optional shape, cardinality, generics и full URL

Нужно выбрать единые type-level и runtime semantics; builder, parser, converter, docs и тесты не должны описывать разные языки.

- [ ] #38 Docs: validating/parsing optional params — выбрать форму optional param (`id?: string` или `id: string | undefined`) и отсутствующего parse result (`{}` или `{ id: undefined }`); тем же решением исправить optional range `:ids<number>{1,3}?`.
- [ ] `[paths]` Решить, проверяет ли builder cardinality `+`/ranges или эти ограничения parse-only; затем согласовать исключения, docs и matrix tests.
- [ ] `[paths]` Определить generic syntax: поддерживать именованные generic-типы вроде `string` одинаково в TS/runtime или отклонять всё, кроме явно реализованных `number`/union.
- [ ] #67 Support full-URL path patterns (micro-frontends) in @effector/router-paths — определить, компилирует ли package только pathname или также origin/base/full URL, включая типы params.

### Решение 6. Общий RouteView tree: lazy parity, nested routers, layouts и `Outlet`

Нужно определить единый рекурсивный контракт `RouteView`: сохраняются ли `children` и metadata всеми transforms, поддерживается ли `Router` как target, сколько уровней рендерит `Outlet` и как выбирается победивший view.

- [ ] #70 [Bug]: createLazyRouteView drops nested children — объединить с React-аудитом: либо гарантировать parity с `createRouteView` и сохранять `children`, либо убрать поле из lazy API/docs.
- [ ] `[react]` Реализовать рекурсивный `OutletContext` для multi-level Outlet либо явно ограничить nesting одним уровнем; синхронизировать пример и three-level test.
- [ ] `[react/solid/vue]` Сохранять весь RouteView metadata в `withLayout` либо определить более узкий контракт transform; проверить parent/child Outlet после layout.
- [ ] `[react]` Выбрать route-selection priority: declaration order или фактический open order; закрепить поведение при нескольких одновременно активных pathless/virtual routes.
- [ ] #73 [Bug]: React Native navigators ignore nested RouteView children and Outlet — определить, участвует ли RN в общем RouteView tree или принимает только плоский список screens.
- [ ] `[solid]` Провайдер `OutletContext` должен спускаться на каждый выбранный child либо рекурсивный `children` type нужно сузить до реально поддерживаемой глубины.
- [ ] `[vue]` Документировать и проверить eager/lazy nested Router, `children` и Outlet только после фиксации общей tree semantics.

### Решение 7. Binding-контракт навигационных ссылок и hooks

Нужно определить, возвращают ли hooks готовое действие с захваченными params/query или низкоуровневый route event, и обязан ли browser href полностью отражать программную навигацию.

- [ ] `[react]` Выбрать контракт `useLink`: curry captured params в возвращаемый handler либо возвращать raw `onOpen` и требовать `onOpen({ params })` во всех примерах.
- [ ] `[react]` Определить query в `<Link href>`: для modified clicks и `target="_blank"` href должен включать query либо документация не должна обещать эквивалентность native navigation.
- [ ] `[react]` Выбрать публичную форму `useRouter`/`useRouterContext`: текущий unit shape `{ query, path, activeRoutes, onBack, onForward, onNavigate }` либо router object/stores/events из документации.
- [ ] `[vue]` Выбрать реальный `Link` type/runtime contract: применить exported conditional `LinkProps` к компоненту или официально оставить optional `any` params; одновременно зафиксировать `query`, `replace`, targets, modifiers, cancellation и anchor attrs.
- [ ] `[vue]` Определить границу обязательности `RouterProvider`: только context consumers либо все advertised APIs с явной runtime validation.

### Решение 8. React Native: ownership синхронизации с React Navigation

Нужно определить source of truth и владельца `NavigationContainer`, ref и history adapter. Без этого нельзя обещать deep links, persistence, gestures или двустороннюю синхронизацию.

- [ ] `[react-native]` Добавить поддерживаемый adapter/init recipe либо встроенный adapter; текущие quick starts вызывают `route.open()` без `router.setHistory` и падают с `history not found`.
- [ ] `[react-native]` Удалить неподдержанные claims про deep links, persistence и time travel либо спроектировать реальные integration points и тесты.
- [ ] #71 [Bug]: React Native navigators do not sync router state to React Navigation — подключить создаваемый navigation ref к реальному container либо передавать ref/container ownership вызывающему коду.
- [ ] #72 [Bug]: Stack navigator does not propagate React Navigation actions to the router — определить и реализовать обратный поток для back, gestures и native actions.
- [ ] `[react-native]` После выбора source of truth устранить stale-state race: сопоставлять emitted `$path` с route синхронно, а не использовать `openedViews` из предыдущего render.

### Решение 9. React Native navigator API: factory shape, screen names/options и params

Нужно выбрать стабильную поверхность factories и screen identity, совместимую с React Navigation types и динамическими/параметризованными routes.

- [ ] `[react-native]` Выбрать return contract factories: компонент напрямую или `{ Navigator }`; синхронизировать README, API и typechecked smoke example.
- [ ] `[react-native]` Определить ownership/precedence `screenOptions`: navigator-level, callback и per-route overrides не должны дублироваться на каждом Screen.
- [ ] #74 [Bug]: Bottom Tabs initialRouteName does not match generated screen names — определить явные screen names либо единую документированную функцию преобразования path в name.
- [ ] #75 [Bug]: React Native screenOptions types reject documented dynamic callbacks — поддержать React Navigation callback type или удалить callback из docs; согласовать с per-screen options.
- [ ] `[react-native]` Ограничить tabs параметр-less routes либо добавить params factory; текущий tab press вызывает `route.open()` без payload.

## Контроль качества после принятия решений

- [ ] Добавить единый docs-conformance pipeline: typecheck исполняемых snippets, проверка source `@link`/sidebar links и smoke tests для quick starts всех bindings.
- [ ] Для core покрыть оставшиеся query round trips, adapter initialization/location, same-value updates, nested params, external/not-found и scope/global-scope сценарии.
- [ ] Для paths добавить table-driven runtime matrix и compile-time assertions для optional/range/cardinality/generic/full-URL случаев.
- [ ] Для React покрыть hooks напрямую, native/modified Link navigation, lazy children, nested routers, layouts и multi-level Outlet.
- [ ] Для React Native создать реальную test suite: factory render shape, ref/container integration, двусторонняя sync, back/gestures, tabs, names, params, options, scopes и cleanup.
- [ ] Для Solid покрыть прямой `useLink`, reactive params, layouts и one-/multi-level Outlet.
- [ ] Для Vue покрыть provider-free/error paths, hooks, Link types/native behavior, nested priority/layouts и multi-level Outlet.
