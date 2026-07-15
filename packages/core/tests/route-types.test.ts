import { expectTypeOf, test } from 'vitest';
import { createRoute } from '../lib';
import type { Event, EventCallable } from 'effector';
import type { PathlessRoute, RouteOpenedPayload, VirtualRoute } from '../lib';

test('path and virtual routes share the public lifecycle contract', () => {
  type Params = { id: string };
  type Route = PathlessRoute<Params>;

  expectTypeOf<Route['open']>().toMatchTypeOf<
    EventCallable<RouteOpenedPayload<Params>>
  >();
  expectTypeOf<Route['close']>().toMatchTypeOf<EventCallable<void>>();
  expectTypeOf<Route['opened']>().toMatchTypeOf<
    Event<RouteOpenedPayload<Params>>
  >();
  expectTypeOf<Route['updated']>().toMatchTypeOf<
    Event<RouteOpenedPayload<Params>>
  >();
  expectTypeOf<Route['closed']>().toMatchTypeOf<Event<void>>();
  expectTypeOf<VirtualRoute<Params>>().toMatchTypeOf<Route>();
});

test('routes without params accept equivalent empty open payloads', () => {
  const route = createRoute({ path: '/home' });

  route.open();
  route.open({});
  route.open({ params: {} });
});

test('rejects duplicate parent and child parameter names', () => {
  const parent = createRoute({ path: '/users/:id' });

  // @ts-expect-error child path cannot redeclare a parent parameter
  createRoute({ path: '/posts/:id', parent });
});
