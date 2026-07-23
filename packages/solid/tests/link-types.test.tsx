import { createRoute } from '@effector/router';
import { expectTypeOf, test } from 'vitest';
import type { JSX as SolidJSX } from 'solid-js';
import { Link } from '../lib';
import type { LinkProps } from '../lib';

const userRoute = createRoute({ path: '/users/:id' });
const homeRoute = createRoute({ path: '/home' });

function compileLinkTypes() {
  const validRequired = <Link to={userRoute} params={{ id: '42' }} />;
  const validOptional = <Link to={homeRoute} />;

  // @ts-expect-error required route params must be supplied
  const missingRequired = <Link to={userRoute} />;

  return [validRequired, validOptional, missingRequired];
}

const requiredProps: LinkProps<{ id: string }> = {
  to: userRoute,
  params: { id: '42' },
};
// @ts-expect-error required route params cannot be omitted from LinkProps
const missingProps: LinkProps<{ id: string }> = { to: userRoute };

test('Link exposes conditional params and anchor props', () => {
  expectTypeOf<ReturnType<typeof compileLinkTypes>>().toMatchTypeOf<
    SolidJSX.Element[]
  >();
  expectTypeOf(requiredProps.params.id).toBeString();
  expectTypeOf(missingProps).toMatchTypeOf<LinkProps<{ id: string }>>();
});
