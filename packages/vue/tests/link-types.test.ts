import { createRoute } from '@effector/router';
import { expectTypeOf, test } from 'vitest';
import type { LinkProps } from '../lib';

const userRoute = createRoute({ path: '/users/:id' });
const homeRoute = createRoute({ path: '/home' });

const validRequired: LinkProps<{ id: string }> = {
  to: userRoute,
  params: { id: '42' },
};
const validOptional: LinkProps<void> = { to: homeRoute };

// @ts-expect-error required route params cannot be omitted from LinkProps
const missingRequired: LinkProps<{ id: string }> = { to: userRoute };

test('Vue LinkProps exposes conditional params and anchor attributes', () => {
  expectTypeOf(validRequired.params.id).toBeString();
  expectTypeOf(validOptional).toMatchTypeOf<LinkProps<void>>();
  expectTypeOf(missingRequired).toMatchTypeOf<LinkProps<{ id: string }>>();
});
