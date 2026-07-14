# React Native binding documentation tasks

Audit scope: `packages/react-native/README.md`, all three pages in `docs/react-native/`, every file in `packages/react-native/lib/`, and the package scripts. The package builds successfully, but it has no test suite (`"test": ""`).

## Актуализация документации

- [ ] Make factory return values match every usage example. Both `createStackNavigator` and `createBottomTabsNavigator` return `{ Navigator: Component }`, while the README and docs assign the whole result and render `<StackNavigator />` / `<TabsNavigator />`. Either return the component directly or document `const { Navigator: StackNavigator } = ...`; add a typechecked smoke example.

- [x] Replace the corrupted API names in the navigator pages. `docs/react-native/stack-navigator.md` repeatedly renders `createeffector / routerStackNavigator`, and `docs/react-native/bottom-tabs-navigator.md` uses `createeffector/routerBottomTabsNavigator`; neither symbol exists. The exported names are `createStackNavigator` and `createBottomTabsNavigator`.

- [ ] Add the required core router initialization to installation and quick starts. The examples call `route.open()` without ever calling `router.setHistory(...)`; core navigation therefore has no adapter and throws `history not found`. Document/install a supported React Native adapter or initialize a memory/custom adapter before rendering.

- [ ] Remove unsupported feature claims from the overview or implement them. No code in this package provides deep-link configuration, state persistence, time-travel integration, or a React Native history adapter; the current implementation only declares screens and attempts imperative navigation. Link each claim to concrete setup/API and tests.

- [ ] Clarify screen option ownership. Stack passes `screenOptions` to both `Stack.Navigator` and every `Stack.Screen.options`; tabs do the same via object spread while also injecting `title`. Document precedence and allow per-route overrides without duplicating navigator-level configuration.

## Модификация поведения

- [ ] Connect a real React Navigation ref before claiming Router-to-native synchronization. Both navigators create `navigationRef`, but never pass it to a `NavigationContainer` or navigator, so `navigationRef.current` remains `null` and every synchronization callback returns without navigating. Design an explicit ref/container integration and test it.

- [ ] Implement or narrow the claimed two-way synchronization. The docs promise that gestures, swipe-back, and React Navigation UI stay synchronized with Effector Router. The stack implementation only attempts Router → React Navigation and has no listener that updates Effector state for native back/gesture actions. Define the source of truth and cover push, replace, tab press, hardware/native back, and swipe-back.

- [ ] Remove the stale-state race in stack synchronization. The `$path` watcher selects `openedViews[openedViews.length - 1]` captured by the current effect instead of matching the emitted path. `useOpenedViews` updates in a separate subscription/render, so the watcher can navigate to the previous view. Resolve from the router/path synchronously and add rapid-navigation tests.

- [ ] Align `screenOptions` with the documented React Navigation surface. Config types accept only an options object, while the bottom-tabs guide demonstrates a callback. The README also promises per-screen options, but `RouteView` has no such field and the implementation reapplies the same global object to every screen. Support object/callback and per-screen options deliberately, or remove those claims.

- [ ] Use one route-name contract for bottom tabs. The implementation strips all slashes (`'/home'` becomes `'home'`), while docs set `initialRouteName: '/home'` and compare `route.name === '/home'` in the screen-options callback. Export/document a deterministic name mapping or accept explicit screen names.

- [ ] Define parameterized-tab behavior. A tab press calls `route.open()` with no payload, so a route such as `'/details/:id'` cannot be opened from the tab bar despite route views accepting any `Route`. Restrict tabs to parameterless routes, support parameter factories, or document how params are supplied and test the choice.

### GitHub issues

- [ ] #71 [Bug]: React Native navigators do not sync router state to React Navigation
- [ ] #72 [Bug]: Stack navigator does not propagate React Navigation actions to the router
- [ ] #73 [Bug]: React Native navigators ignore nested RouteView children and Outlet
- [ ] #74 [Bug]: Bottom Tabs initialRouteName does not match generated screen names
- [ ] #75 [Bug]: React Native screenOptions types reject documented dynamic callbacks

## Контроль качества

- [ ] Add a real React Native test suite. At minimum cover the documented render shape, factory return contract, route-name mapping, initial route, Router → native navigation, tab press → Router, native back/gesture → Router, parameterized routes, Effector scopes, cleanup, and object/function screen options. A successful bundle build does not validate any integration behavior above.
