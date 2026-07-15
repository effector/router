import { expectTypeOf, test } from 'vitest';
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
