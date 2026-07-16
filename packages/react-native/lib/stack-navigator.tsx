import * as React from 'react';
import { useEffect } from 'react';
import { StackActions } from '@react-navigation/native';
import {
  createStackNavigator as createReactNavigationStackNavigator,
  StackNavigatorProps,
  StackNavigationOptions,
} from '@react-navigation/stack';
import type { Router } from '@effector/router';
import type { RouteView } from '@effector/router-react';
import { scopeBind } from 'effector';
import { useProvidedScope } from 'effector-react';
import {
  getScreenKey,
  getScreenName,
  validateInitialRouteName,
} from './route-name';
import { flattenRouteViews } from './route-views';
import { createRouterSync } from './navigation-sync';
import {
  createClosingTransitionListener,
  createRouteListeners,
} from './navigation-events';
import { NativeNavigator, NativeNavigatorProps } from './native-navigator';
import { subscribeNavigation } from './navigation-bridge';

export type StackRouteView = RouteView & {
  options?: React.ComponentProps<typeof Stack.Screen>['options'];
};

export type StackNavigatorConfig = {
  router: Router;
  routes: StackRouteView[];
  screenOptions?: StackNavigatorProps['screenOptions'];
  initialRouteName?: string;
};

export type { StackNavigationOptions as StackNavigatorOptions };

const Stack = createReactNavigationStackNavigator();

/**
 * Creates an  Stack Navigator that integrates with React Navigation
 *
 * @example
 * ```tsx
 * import { createStackNavigator } from '@effector/router-react-native';
 * import { router } from './router';
 * import { HomeScreen, ProfileScreen } from './screens';
 *
 * const StackNavigator = createStackNavigator({
 *   router,
 *   routes: [HomeScreen, ProfileScreen],
 *   screenOptions: {
 *     headerStyle: { backgroundColor: '#f4511e' },
 *     headerTintColor: '#fff',
 *   },
 * });
 *
 * function App() {
 *   return (
 *     <NavigationContainer>
 *       <StackNavigator />
 *     </NavigationContainer>
 *   );
 * }
 * ```
 */
export function createStackNavigator(
  config: StackNavigatorConfig,
): NativeNavigator {
  const { router: Router, routes, screenOptions, initialRouteName } = config;
  validateInitialRouteName(flattenRouteViews(routes), initialRouteName);

  const StackNavigator = function StackNavigator({
    navigationRef,
  }: NativeNavigatorProps) {
    const scope = useProvidedScope();
    const routeViews = React.useMemo(() => flattenRouteViews(routes), [routes]);

    // Sync Router state with the navigation object from NavigationContainer.
    useEffect(() => {
      const sync = createRouterSync({
        router: Router,
        routes: routeViews,
        scope: scope ?? undefined,
        navigation: {
          navigate: (name, params) =>
            navigationRef.navigate(name, params as object | undefined),
          replace: (name, params) =>
            navigationRef.dispatch(
              StackActions.replace(name, params as object | undefined),
            ),
        },
      });
      const unsubscribeNative = subscribeNavigation(
        navigationRef,
        scope ? scopeBind(sync.onSnapshot, { scope }) : sync.onSnapshot,
      );

      return () => {
        unsubscribeNative();
        sync.cleanup();
      };
    }, [navigationRef, routeViews, scope]);

    return (
      <Stack.Navigator
        screenOptions={screenOptions}
        initialRouteName={initialRouteName}
      >
        {routeViews.map((routeView, index) => {
          const routeName = getScreenName(routeView.route, index);
          const routeKey = getScreenKey(routeView.route, index);

          return (
            <Stack.Screen
              key={routeKey}
              name={routeName}
              component={routeView.view}
              options={(routeView as StackRouteView).options}
              listeners={{
                ...createRouteListeners(routeView.route, scope),
                transitionEnd: createClosingTransitionListener(
                  routeView.route,
                  scope,
                ),
              }}
            />
          );
        })}
      </Stack.Navigator>
    );
  };

  return StackNavigator as unknown as NativeNavigator;
}
