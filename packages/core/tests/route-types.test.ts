import { expectTypeOf, test } from 'vitest';
import { createRoute, createRouterControls, trackQuery } from '../lib';
import type { Event, EventCallable } from 'effector';
import type {
  PathlessRoute,
  RouteOpenedPayload,
  RouteUpdatedPayload,
  VirtualRoute,
} from '../lib';
import { z } from 'zod/v4';

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
  expectTypeOf<Route['updated']>().toEqualTypeOf<
    Event<RouteUpdatedPayload<Params>>
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

test('trackQuery accepts URL values and publishes schema output', () => {
  const controls = createRouterControls();
  const tracker = trackQuery({
    controls,
    parameters: z.object({ page: z.coerce.number() }),
  });

  tracker.enter({ page: '2' });
  // @ts-expect-error domain numbers must be converted before enter
  tracker.enter({ page: 2 });
  // @ts-expect-error keys outside the schema are rejected
  tracker.enter({ other: 'value' });

  expectTypeOf(tracker.entered).toMatchTypeOf<Event<{ page: number }>>();
});
