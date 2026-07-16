import * as React from 'react';
import { useEffect } from 'react';
import {
  createStackNavigator as createReactNavigationStackNavigator,
  StackNavigatorProps,
  StackNavigationOptions,
} from '@react-navigation/stack';
import type { Router } from '@effector/router';
import type { RouteView } from '@effector/router-react';
import { createWatch, scopeBind } from 'effector';
import { useProvidedScope } from 'effector-react';
import { getScreenKey, getScreenName } from './route-name';
import { flattenRouteViews } from './route-views';
import { syncActiveRoute } from './navigation-sync';
import { createRouteListeners } from './navigation-events';
import { NativeNavigator, NativeNavigatorProps } from './native-navigator';
import { subscribeNavigation } from './navigation-bridge';

export type StackNavigatorConfig = {
  router: Router;
  routes: RouteView[];
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

  const StackNavigator = function StackNavigator({
    navigationRef,
  }: NativeNavigatorProps) {
    const scope = useProvidedScope();
    const routeViews = React.useMemo(() => flattenRouteViews(routes), [routes]);

    // Sync Router state with the navigation object from NavigationContainer.
    useEffect(() => {
      const onSnapshot = (snapshot: unknown) => {
        void snapshot;
      };
      const unsubscribeNative = subscribeNavigation(
        navigationRef,
        scope ? scopeBind(onSnapshot, { scope }) : onSnapshot,
      );
      const subscription = createWatch({
        unit: Router.$activeRoutes,
        scope: scope ?? undefined,
        fn: (activeRoutes) => {
          syncActiveRoute(navigationRef, activeRoutes, routeViews);
        },
      });

      return () => {
        unsubscribeNative();
        subscription.unsubscribe();
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
              listeners={createRouteListeners(routeView.route)}
            />
          );
        })}
      </Stack.Navigator>
    );
  };

  return StackNavigator as unknown as NativeNavigator;
}
