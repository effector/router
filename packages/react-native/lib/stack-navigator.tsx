import * as React from 'react';
import { useEffect } from 'react';
import {
  createStackNavigator as createReactNavigationStackNavigator,
  StackNavigatorProps,
  StackNavigationOptions,
} from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import type { Router } from '@effector/router';
import type { RouteView } from '@effector/router-react';
import { createWatch } from 'effector';
import { useProvidedScope } from 'effector-react';
import { getScreenKey, getScreenName } from './route-name';
import { flattenRouteViews } from './route-views';
import { syncActiveRoute } from './navigation-sync';
import { createRouteListeners } from './navigation-events';

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
export function createStackNavigator(config: StackNavigatorConfig): {
  Navigator: React.ComponentType;
} {
  const { router: Router, routes, screenOptions, initialRouteName } = config;

  const StackNavigator = function StackNavigator() {
    const scope = useProvidedScope();
    const routeViews = React.useMemo(() => flattenRouteViews(routes), [routes]);
    const navigation = useNavigation<{ navigate: (name: string) => void }>();

    // Sync Router state with the navigation object from NavigationContainer.
    useEffect(() => {
      const subscription = createWatch({
        unit: Router.$activeRoutes,
        scope: scope ?? undefined,
        fn: (activeRoutes) => {
          syncActiveRoute(navigation, activeRoutes, routeViews);
        },
      });

      return () => subscription.unsubscribe();
    }, [navigation, routeViews, scope]);

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

  return { Navigator: StackNavigator };
}
