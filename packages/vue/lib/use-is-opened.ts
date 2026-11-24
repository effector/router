import { is, type Route, type Router } from '@effector/router';
import type { Store } from 'effector';
import { useProvidedScope, useUnit } from 'effector-vue/composition';
import {
  computed,
  effectScope,
  isRef,
  shallowRef,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
} from 'vue';

/** @internal A source and the refs of the stores read from it. */
interface UnitsOf<Source> {
  source: Source;
  refs: Readonly<Ref<any>>[];
}

/**
 * @internal `useUnit` for stores taken from a value, a ref or a getter. The
 * result holds the source together with its refs, so a reader never pairs a
 * new source with the refs of the old one.
 *
 * A plain value is subscribed once, as `useUnit` does. For a ref or a getter:
 * - `watch` subscribes again when the source changes. `flush: 'sync'` runs it
 *   at the moment of the change, before anything reads the result.
 * - Each subscription lives in its own `effectScope`: `useUnit` ends its
 *   subscription when the active effect scope stops, and stopping that scope
 *   ends only the subscription of the previous source. The scope is detached
 *   (`true`): a later run of the watch may happen inside the effect scope of
 *   another component, and a child scope would then stop with that component.
 *   The cleanup of the watch stops it on the next run and on unmount.
 * - A watch callback has no injection context, so the Effector scope is read
 *   in setup and passed to `useUnit`.
 * React and Solid need none of this: hooks and accessors subscribe again on
 * their own.
 * Tests: "useIsOpened follows a route that a getter switches", "the
 * subscription of the previous route ends when the route changes", "a route
 * switched in the setup of another component keeps its subscription", "the
 * subscription ends on unmount".
 */
export function useUnitsOf<Source extends object>(
  input: MaybeRefOrGetter<Source>,
  getStores: (source: Source) => Store<any>[],
): Readonly<ShallowRef<UnitsOf<Source>>> {
  if (!isRef(input) && typeof input !== 'function') {
    return shallowRef({ source: input, refs: useUnit(getStores(input)) });
  }

  const scope = useProvidedScope();
  const options = scope ? { scope } : {};
  // Filled by the first run of the watch below, before this function returns.
  const result = shallowRef() as ShallowRef<UnitsOf<Source>>;

  watch(
    () => toValue(input),
    (source, _previous, onCleanup) => {
      const subscription = effectScope(true);

      result.value = {
        source,
        refs: subscription.run(() => useUnit(getStores(source), options))!,
      };
      onCleanup(() => subscription.stop());
    },
    { immediate: true, flush: 'sync' },
  );

  return result;
}

/**
 * @description Reactive flag telling whether the given route (or router) is
 * currently opened. The route may be a ref or a getter.
 * @link https://router.effector.dev/vue/use-is-opened.html
 */
export function useIsOpened(
  route: MaybeRefOrGetter<Pick<Route<any>, '$isOpened'> | Router>,
): ComputedRef<boolean> {
  const state = useUnitsOf(route, (target) => [
    is.router(target) ? target.$activeRoutes : target.$isOpened,
  ]);

  return computed(() => {
    const { source, refs } = state.value;
    const value: unknown = refs[0].value;

    return is.router(source) ? (value as unknown[]).length > 0 : Boolean(value);
  });
}
