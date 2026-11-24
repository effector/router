import { expectTypeOf, test } from 'vitest';
import type { VNode } from 'vue';
import { createRoutesView, Outlet, type RouteViewSlotProps } from '../lib';

type DefaultSlot = (props: RouteViewSlotProps) => VNode[];

// `h()` types its children loosely and cannot check slot props, so the slot
// is read from `$slots`, where templates and TSX take it.
test('RoutesView and Outlet declare the default slot', () => {
  type RoutesViewSlots = InstanceType<
    ReturnType<typeof createRoutesView>
  >['$slots'];
  type OutletSlots = InstanceType<typeof Outlet>['$slots'];

  expectTypeOf<RoutesViewSlots['default']>().toEqualTypeOf<
    DefaultSlot | undefined
  >();
  expectTypeOf<OutletSlots['default']>().toEqualTypeOf<
    DefaultSlot | undefined
  >();
});
