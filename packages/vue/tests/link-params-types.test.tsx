/** @jsxImportSource vue */
import { createRoute, type Route } from '@effector/router';
import { expectTypeOf, test } from 'vitest';
import { defineComponent, h, type Component, type VNode } from 'vue';
import {
  Link,
  type LinkProps,
  type LinkPropsOf,
  type LinkSlotProps,
} from '../lib';

const user = createRoute({ path: '/users/:id' });
const home = createRoute({ path: '/home' });
const post = createRoute({ path: '/posts/:id<number>' });
const comment = createRoute({ path: '/comments/:commentId', parent: post });
const tags = createRoute({ path: '/tags/:tag?' });
const userTab = createRoute({ path: '/users/:id/:tab?' });

// The JSX and the `h()` calls below are checked and never run.
test('Link infers params from the route in TSX', () => {
  const calls = () => [
    <Link to={user} params={{ id: '42' }} />,
    <Link to={home} />,
    <Link to={home} params={undefined} />,
    <Link to={post} params={{ id: 7 }} />,
    // Params of the parent chain are part of the params of the route.
    <Link to={comment} params={{ id: 7, commentId: 'a' }} />,
    // A route with only optional params takes no `params`, as in 0.1.0.
    <Link to={tags} />,
    <Link to={tags} params={{ tag: 'a' }} />,
    <Link to={Math.random() > 0.5 ? home : tags} />,
    <Link to={userTab} params={{ id: '42' }} />,
    <Link
      to={user}
      params={{ id: '42' }}
      query={{ tab: 'a' }}
      replace
      activeClass="active"
      exactActiveClass="exact"
      class="nav"
      id="user"
      aria-label="User"
      rel="nofollow"
      target="_blank"
      onClick={(event: MouseEvent) => event.preventDefault()}
    />,

    // @ts-expect-error a route with params needs `params`
    <Link to={user} />,
    // @ts-expect-error one required param is enough to need `params`
    <Link to={userTab} />,
    // @ts-expect-error `id` is a string in the path of the route
    <Link to={user} params={{ id: 42 }} />,
    // @ts-expect-error `id` is a number in the path of the route
    <Link to={post} params={{ id: '7' }} />,
    // @ts-expect-error a param of the parent route is missing
    <Link to={comment} params={{ commentId: 'a' }} />,
    // @ts-expect-error a route without params takes none
    <Link to={home} params={{ id: '42' }} />,
    // @ts-expect-error `to` is required
    <Link />,
    // @ts-expect-error `to` is a route
    <Link to="/home" />,
  ];

  expectTypeOf(calls).returns.toEqualTypeOf<VNode[]>();
});

// `h()` replaces the type parameter of a generic component by its
// constraint, `Route<any>`, so it accepts these calls and cannot check
// `params`. The call forms are the ones of tests/index.test.ts.
test('h(Link) calls of 0.1.0 keep compiling', () => {
  const calls = () => [
    h(Link, { to: home }),
    h(Link, { to: home, id: 'link' }, () => 'to home'),
    h(Link, { to: user, params: { id: '123' }, query: { tab: 'details' } }),
    h(
      Link,
      { to: user, params: { id: '42' }, query: {}, replace: true },
      () => 'to user',
    ),
    h(Link, {
      to: user,
      params: { id: '42' },
      id: 'target-link',
      'aria-label': 'Target',
      'data-kind': 'route',
      rel: 'nofollow',
      onClick: (event: MouseEvent) => event.preventDefault(),
    }),
    h(Link, { to: home, target: '_blank' }),
    h(Link, { to: home, download: 'file' }),
    // Not checked by `h()`: the missing `params` is found only at run time.
    h(Link, { to: user }),
  ];
  const Host = defineComponent({ components: { Link }, template: '<Link />' });
  const asComponent: Component = Link;

  expectTypeOf(calls).returns.toEqualTypeOf<VNode[]>();
  expectTypeOf(Host).not.toBeAny();
  expectTypeOf(asComponent).not.toBeAny();
});

test('h(Link) still rejects a call without a route', () => {
  const calls = () => [
    // @ts-expect-error `to` is required
    h(Link, {}),
    // @ts-expect-error `to` is a route
    h(Link, { to: 123 }),
  ];

  expectTypeOf(calls).toBeFunction();
});

test('LinkPropsOf follows the params of the route', () => {
  expectTypeOf<LinkPropsOf<typeof user>['params']>().toEqualTypeOf<{
    id: string;
  }>();
  expectTypeOf<LinkPropsOf<typeof home>['params']>().toEqualTypeOf<
    void | undefined
  >();
  expectTypeOf<LinkPropsOf<typeof user>['to']>().toEqualTypeOf<typeof user>();
  // Without a known route every params value is accepted, as in `h()`.
  expectTypeOf<LinkPropsOf<Route<any>>['params']>().toBeAny();
});

test('LinkProps of 0.1.0 is unchanged', () => {
  const required: LinkProps<{ id: string }> = { to: user, params: { id: '1' } };
  const optional: LinkProps = { to: home };
  // @ts-expect-error required route params cannot be omitted from LinkProps
  const missing: LinkProps<{ id: string }> = { to: user };

  expectTypeOf(required.params).toEqualTypeOf<{ id: string }>();
  expectTypeOf(optional.params).toEqualTypeOf<void | undefined>();
  expectTypeOf(missing).not.toBeAny();
});

test('the instance of Link has typed slots', () => {
  type Slots = InstanceType<typeof Link>['$slots'];

  expectTypeOf<Slots['default']>().toEqualTypeOf<
    ((props: LinkSlotProps) => VNode[]) | undefined
  >();
});
