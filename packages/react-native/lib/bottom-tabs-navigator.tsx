import * as React from 'react';
import { useEffect } from 'react';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
  BottomTabNavigatorProps,
} from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { Router } from '@effector/router';
import type { RouteView } from '@effector/router-react';
import { createWatch } from 'effector';
import { useProvidedScope } from 'effector-react';
import { getScreenKey, getScreenName, getScreenTitle } from './route-name';
import { flattenRouteViews } from './route-views';
import { syncActiveRoute } from './navigation-sync';
import { createRouteListeners, openRoute } from './navigation-events';

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

    // Handle tab press to open route in  Router
    return (
      <Tab.Navigator
        screenOptions={screenOptions}
        initialRouteName={initialRouteName}
      >
        {routeViews.map((routeView, index) => {
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
                ...createRouteListeners(routeView.route),
                tabPress: (e) => {
                  // Prevent default navigation
                  e.preventDefault();
                  // Open route via  Router
                  openRoute(routeView.route);
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
