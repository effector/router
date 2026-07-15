import * as React from 'react';
import { useEffect } from 'react';
import {
  createStackNavigator as createReactNavigationStackNavigator,
  StackNavigatorProps,
  StackNavigationOptions,
} from '@react-navigation/stack';
import type { Router } from '@effector/router';
import type { RouteView } from '@effector/router-react';
import { useOpenedViews } from '@effector/router-react';
import { createWatch } from 'effector';
import { useProvidedScope } from 'effector-react';
import { getScreenKey, getScreenName } from './route-name';

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
    const openedViews = useOpenedViews(routes);
    const navigationRef = React.useRef<any>(null);

    // Sync  Router state with React Navigation
    useEffect(() => {
      const subscription = createWatch({
        unit: Router.$path,
        scope: scope ?? undefined,
        fn: (path) => {
          if (!navigationRef.current || !path) return;

          // Find the matching route for the current path
          const matchingView = openedViews[openedViews.length - 1];
          if (matchingView) {
            const routeName = getScreenName(
              matchingView.route,
              routes.findIndex((r) => r.route === matchingView.route),
            );

            // Navigate to the route in React Navigation
            try {
              navigationRef.current.navigate(routeName);
            } catch (error) {
              console.error(error);
            }
          }
        },
      });

      return () => subscription.unsubscribe();
    }, [openedViews, scope]);

    return (
      <Stack.Navigator
        screenOptions={screenOptions}
        initialRouteName={initialRouteName}
      >
        {routes.map((routeView, index) => {
          const routeName = getScreenName(routeView.route, index);
          const routeKey = getScreenKey(routeView.route, index);

          return (
            <Stack.Screen
              key={routeKey}
              name={routeName}
              component={routeView.view}
            />
          );
        })}
      </Stack.Navigator>
    );
  };

  return { Navigator: StackNavigator };
}
