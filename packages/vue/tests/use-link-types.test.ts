import { createRoute, type QueryInput, type Route } from '@effector/router';
import { expectTypeOf, test } from 'vitest';
import { computed, ref, shallowRef, type ComputedRef, type Ref } from 'vue';
import { useIsOpened, useLink, type UseLinkReturn } from '../lib';

const home = createRoute({ path: '/home' });
const user = createRoute({ path: '/users/:id' });

// Composables run only in `setup`, so these calls are checked and never run.
test('useLink accepts values, refs and getters', () => {
  const calls = () => {
    const params = ref({ id: '1' });
    const query = computed<QueryInput | undefined>(() => ({ tab: 'a' }));

    return [
      useLink(user, { id: '1' }, { tab: 'a' }),
      useLink(user, params, query),
      useLink(
        () => user,
        () => params.value,
        () => undefined,
      ),
      useLink(shallowRef(user), params),
    ];
  };

  expectTypeOf(calls).returns.toEqualTypeOf<UseLinkReturn<{ id: string }>[]>();
});

test('useLink checks params against the route', () => {
  const calls = () => {
    // @ts-expect-error `id` is a string in the path of the route
    useLink(user, { id: 1 });
    // @ts-expect-error the same for a ref
    useLink(user, ref({ id: 1 }));
  };

  expectTypeOf(calls).toBeFunction();
});

test('useLink returns refs for the state of the link', () => {
  type Link = UseLinkReturn<{ id: string }>;

  expectTypeOf<Link['href']>().toEqualTypeOf<Readonly<Ref<string>>>();
  expectTypeOf<Link['isActive']>().toEqualTypeOf<Readonly<Ref<boolean>>>();
  expectTypeOf<Link['isExactActive']>().toEqualTypeOf<Readonly<Ref<boolean>>>();
  expectTypeOf<Link['navigate']>().toEqualTypeOf<
    (event?: MouseEvent) => void
  >();
});

test('useIsOpened accepts a value, a ref and a getter', () => {
  const calls = () => {
    const to = shallowRef<Route<void>>(home);

    return [useIsOpened(home), useIsOpened(to), useIsOpened(() => to.value)];
  };

  expectTypeOf(calls).returns.toEqualTypeOf<ComputedRef<boolean>[]>();
});
