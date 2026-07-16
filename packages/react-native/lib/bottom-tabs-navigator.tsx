import * as React from 'react';
import { useEffect } from 'react';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
  BottomTabNavigatorProps,
} from '@react-navigation/bottom-tabs';
import type { Router } from '@effector/router';
import type { RouteView } from '@effector/router-react';
import { scopeBind } from 'effector';
import { useProvidedScope } from 'effector-react';
import {
  getScreenKey,
  getScreenName,
  validateBottomTabsRoutes,
  validateInitialRouteName,
} from './route-name';
import { flattenRouteViews } from './route-views';
import { createRouterSync } from './navigation-sync';
import { createRouteListeners, openRoute } from './navigation-events';
import { NativeNavigator, NativeNavigatorProps } from './native-navigator';
import { subscribeNavigation } from './navigation-bridge';

export type BottomTabsRouteView = RouteView & {
  options?: React.ComponentProps<typeof Tab.Screen>['options'];
};

export type BottomTabsNavigatorConfig = {
  router: Router;
  routes: BottomTabsRouteView[];
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
export function createBottomTabsNavigator(
  config: BottomTabsNavigatorConfig,
): NativeNavigator {
  const { router: Router, routes, screenOptions, initialRouteName } = config;
  const flatRoutes = flattenRouteViews(routes);
  validateBottomTabsRoutes(flatRoutes);
  validateInitialRouteName(flatRoutes, initialRouteName);

  const BottomTabsNavigator = function BottomTabsNavigator({
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

    // Handle tab press to open route in  Router
    return (
      <Tab.Navigator
        screenOptions={screenOptions}
        initialRouteName={initialRouteName}
      >
        {routeViews.map((routeView, index) => {
          const routeName = getScreenName(routeView.route, index);
          const routeKey = getScreenKey(routeView.route, index);
          return (
            <Tab.Screen
              key={routeKey}
              name={routeName}
              component={routeView.view}
              options={(routeView as BottomTabsRouteView).options}
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

  return BottomTabsNavigator as unknown as NativeNavigator;
}
