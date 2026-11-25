import {
  createRoute,
  type NavigatePayload,
  type Query,
  type QueryInput,
  type Route,
  type RouteOpenPayload,
  type Router,
} from '@effector/router';
import type { UseUnitResult } from 'effector-vue/composition';
import { expectTypeOf, test } from 'vitest';
import type { Ref } from 'vue';
import {
  useLink,
  useRouter,
  type UseLinkReturn,
  type UseRouterReturn,
} from '../lib';

const home = createRoute({ path: '/home' });
const user = createRoute({ path: '/users/:id' });

test('useRouter returns refs and plain functions', () => {
  expectTypeOf(useRouter).returns.toEqualTypeOf<UseRouterReturn>();
  expectTypeOf<UseRouterReturn>().toEqualTypeOf<{
    query: Readonly<Ref<Query>>;
    path: Readonly<Ref<string | null>>;
    activeRoutes: Readonly<Ref<Route<any>[]>>;
    onBack: () => void;
    onForward: () => void;
    onNavigate: (payload: NavigatePayload) => NavigatePayload;
  }>();
});

// The interface is written by hand. This keeps it equal to what `useUnit`
// derives from the unit shape of the router.
test('UseRouterReturn matches the unit shape of the router', () => {
  type Shape = ReturnType<Router['@@unitShape']>;

  expectTypeOf<UseRouterReturn>().toEqualTypeOf<UseUnitResult<Shape>>();
});

test('useLink returns a builder and a bound event', () => {
  expectTypeOf(useLink<{ id: string }>).returns.toEqualTypeOf<
    UseLinkReturn<{ id: string }>
  >();
  expectTypeOf<UseLinkReturn<{ id: string }>>().toEqualTypeOf<{
    build: (params?: { id: string }, query?: QueryInput) => string;
    onOpen: (
      payload: RouteOpenPayload<{ id: string }>,
    ) => RouteOpenPayload<{ id: string }>;
    href: Readonly<Ref<string>>;
    isActive: Readonly<Ref<boolean>>;
    isExactActive: Readonly<Ref<boolean>>;
    navigate: (event?: MouseEvent) => void;
  }>();
});

// Composables run only in `setup`, so these calls are checked and never run.
test('useLink keeps the call forms of 0.1.0', () => {
  const calls = () => {
    const toHome = useLink(home);
    const toUser = useLink(user);

    toHome.build();
    toHome.onOpen();
    toHome.onOpen({ query: { tab: 'a' }, replace: true });
    toUser.build({ id: '1' }, { tab: 'a' });
    toUser.onOpen({ params: { id: '1' } });
    // @ts-expect-error a route with params needs them in the payload
    toUser.onOpen({});
  };

  expectTypeOf(calls).toBeFunction();
});
