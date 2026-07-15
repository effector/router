# Tasks

Список работ после принятия решений из [DECISIONS.md](DECISIONS.md) и
исправления конкретных дефектов из [BUGS.md](BUGS.md). Пункты сгруппированы по
порядку зависимости, а не по старым audit-файлам.

## 1. Core и paths

- Исправить B1–B4: global-scope navigation, falsy params, arbitrary-name
  conversion и optional ranges.
- Реализовать выбранную модель parent params, pathless routes, partial updates
  и equality из D3; закрыть B5 и B7.
- Реализовать query semantics из D1–D2: `navigate`, `trackQuery`, replace,
  serializer и ownership operators.
- Согласовать `RouterAdapter.location`, partial targets, pre-initialization
  `$path`, not-found и router lifecycle events по D4.
- Привести core API reference к реально экспортируемым типам и выбранным
  payloads.
- Добавить core matrix для query round trips, adapter initialization/location,
  same-value updates, nested params, not-found и global scope.
- Добавить paths matrix для optional/range/cardinality/generic/full-URL случаев,
  включая compile-time assertions.

## 2. RouteView tree и общие bindings

- Исправить B8 и B9: сохранять `children` и RouteView metadata в lazy views и
  `withLayout`.
- Реализовать выбранную глубину `Outlet`, nested Router semantics,
  declaration/open-order priority и shared layout identity по D6.
- Исправить B10: согласовать URL builder и native anchor behavior с выбранной
  политикой query.
- Синхронизировать React, Solid и Vue RouteView types, docs и nested tests.

## 3. React

- Обновить `useOpenedViews` и route selection examples для pathless/virtual
  routes.
- Обновить `<Link>` для query/native navigation после D7 и покрыть modified
  clicks и `_blank`.
- Закрыть React-specific часть B8, multi-level `Outlet`, `withLayout` и #57.

## 4. Solid

- Закрыть B6: выбрать общий viewable-route contract или расширить Solid helper
  types для `VirtualRoute`.
- Сохранить metadata в `withLayout`, реализовать/ограничить `Outlet` nesting и
  добавить parent/child tests.
- Добавить прямые tests для `useLink`, reactive params и active-link policy.
- Синхронизировать Solid docs с выбранными RouteView и layout contracts.

## 5. Vue

- Документировать полный `createRouteView`/`createLazyRouteView` contract,
  nested Router, `children` и `Outlet`.
- Обновить Vue `Link` docs/types/runtime для query, replace, targets, modifiers,
  cancellation, attrs и params typing.
- Закрыть Vue-specific часть shared layout и nested Outlet work.

## 6. React Native

- Реализовать выбранный source of truth и ownership `NavigationContainer`/
  navigation ref (D9); закрыть B11–B13.
- Добавить adapter/init recipe и убрать неподтверждённые claims про deep links,
  persistence и time travel.
- Согласовать factory return shape, screen names, `initialRouteName`,
  `screenOptions` и parameterized tabs; закрыть B14–B15.
- Устранить stale-state race и добавить двустороннюю sync для push, replace,
  native back, gestures и tab presses.
- Создать настоящую RN test suite: render shape, factory contract, names,
  params, scopes, cleanup и native actions.

## 7. Документация и QA

- Добавить docs-conformance pipeline: typecheck snippets, проверку source
  `@link`/sidebar links и smoke tests quick starts.
- После каждого решения обновить соответствующие package README и docs pages,
  не смешивая application policy с core API.
