import * as React from 'react';
import { useEffect } from 'react';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
  BottomTabNavigatorProps,
} from '@react-navigation/bottom-tabs';
import type { Router } from '@effector/router';
import type { RouteView } from '@effector/router-react';
import { createWatch } from 'effector';
import { useProvidedScope } from 'effector-react';
import { getScreenKey, getScreenName, getScreenTitle } from './route-name';

export type BottomTabsNavigatorConfig = {
  router: Router;
  routes: RouteView[];
  screenOptions?: BottomTabNavigatorProps['screenOptions'];
  initialRouteName?: string;
};

export type { BottomTabNavigationOptions };

const Tab = createBottomTabNavigator();

/**
 * Creates an  Bottom Tabs Navigator that integrates with React Navigation
 *
 * @example
 * ```tsx
 * import { createBottomTabsNavigator } from '@effector/router-react-native';
 * import { router } from './router';
 * import { HomeScreen, SearchScreen, ProfileScreen } from './screens';
 *
 * const TabsNavigator = createBottomTabsNavigator({
 *   router,
 *   routes: [HomeScreen, SearchScreen, ProfileScreen],
 *   screenOptions: {
 *     tabBarActiveTintColor: '#007AFF',
 *     tabBarInactiveTintColor: '#8e8e93',
 *   },
 * });
 *
 * function App() {
 *   return (
 *     <NavigationContainer>
 *       <TabsNavigator />
 *     </NavigationContainer>
 *   );
 * }
 * ```
 */
export function createBottomTabsNavigator(config: BottomTabsNavigatorConfig): {
  Navigator: React.ComponentType;
} {
  const { router: Router, routes, screenOptions, initialRouteName } = config;

  const BottomTabsNavigator = function BottomTabsNavigator() {
    const scope = useProvidedScope();
    const navigationRef = React.useRef<any>(null);

    // Sync  Router state with React Navigation
    useEffect(() => {
      const subscription = createWatch({
        unit: Router.$activeRoutes,
        scope: scope ?? undefined,
        fn: (activeRoutes) => {
          if (!navigationRef.current || activeRoutes.length === 0) return;

          // Find the last active route
          const lastActiveRoute = activeRoutes[activeRoutes.length - 1];
          const matchingIndex = routes.findIndex(
            (r) => r.route === lastActiveRoute,
          );

          if (matchingIndex !== -1) {
            const routeName = getScreenName(
              routes[matchingIndex].route,
              matchingIndex,
            );

            // Navigate to the route in React Navigation
            try {
              navigationRef.current.navigate(routeName);
            } catch (error) {
              console.error(error);
              // Route might not be mounted yet
            }
          }
        },
      });

      return () => subscription.unsubscribe();
    }, [scope]);

    // Handle tab press to open route in  Router
    const createTabPressHandler = React.useCallback((routeView: RouteView) => {
      return () => {
        if (
          'open' in routeView.route &&
          typeof routeView.route.open === 'function'
        ) {
          routeView.route.open();
        }
      };
    }, []);

    return (
      <Tab.Navigator
        screenOptions={screenOptions}
        initialRouteName={initialRouteName}
      >
        {routes.map((routeView, index) => {
          const routeName = getScreenName(routeView.route, index);
          const routeKey = getScreenKey(routeView.route, index);
          const title = getScreenTitle(routeView.route, index);

          return (
            <Tab.Screen
              key={routeKey}
              name={routeName}
              component={routeView.view}
              options={{ title }}
              listeners={{
                tabPress: (e) => {
                  // Prevent default navigation
                  e.preventDefault();
                  // Open route via  Router
                  createTabPressHandler(routeView)();
                },
              }}
            />
          );
        })}
      </Tab.Navigator>
    );
  };

  return { Navigator: BottomTabsNavigator };
}
