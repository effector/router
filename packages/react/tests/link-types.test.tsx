import { createRoute } from '@effector/router';
import { expectTypeOf, test } from 'vitest';
import type { ReactElement } from 'react';
import { Link } from '../lib';
import type { LinkProps } from '../lib';

const userRoute = createRoute({ path: '/users/:id' });
const homeRoute = createRoute({ path: '/home' });

const validRequired = (
  <Link to={userRoute} params={{ id: '42' }} aria-label="User" />
);
const validOptional = <Link to={homeRoute} />;

// @ts-expect-error required route params must be supplied
const missingRequired = <Link to={userRoute} />;

const requiredProps: LinkProps<{ id: string }> = {
  to: userRoute,
  params: { id: '42' },
};
// @ts-expect-error required route params cannot be omitted from LinkProps
const missingProps: LinkProps<{ id: string }> = { to: userRoute };

test('Link exposes conditional params and anchor props', () => {
  expectTypeOf(validRequired).toMatchTypeOf<ReactElement>();
  expectTypeOf(validOptional).toMatchTypeOf<ReactElement>();
  expectTypeOf(requiredProps.params.id).toBeString();
  expectTypeOf(missingRequired).toMatchTypeOf<ReactElement>();
  expectTypeOf(missingProps).toMatchTypeOf<LinkProps<{ id: string }>>();
});
