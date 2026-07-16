import { createRoute, createRouter } from '../../packages/core/lib/index';
import { createStackNavigator } from '../../packages/react-native/lib/index';
import { createRouteView } from '../../packages/react/lib/index';
import { Text } from 'react-native';

export function createReactNativeQuickStart(): any {
  const home = createRoute({ path: '/home' });
  const profile = createRoute({ path: '/profile/:id' });
  const router = createRouter({ routes: [home, profile] });
  const Home = createRouteView({ route: home, view: () => <Text>Home</Text> });
  const Profile = createRouteView({
    route: profile,
    view: () => <Text>Profile</Text>,
  });
  const Stack = createStackNavigator({
    router,
    routes: [Home, Profile],
  });

  return { home, profile, router, Stack };
}
