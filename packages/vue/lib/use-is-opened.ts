import { is, type Route, type Router } from '@effector/router';
import { useUnit } from 'effector-vue/composition';
import { computed, type ComputedRef } from 'vue';

/**
 * @description Reactive flag telling whether the given route (or router) is
 * currently opened.
 * @link https://router.effector.dev/vue/use-is-opened.html
 */
export function useIsOpened(
  route: Pick<Route<any>, '$isOpened'> | Router,
): ComputedRef<boolean> {
  if (is.router(route)) {
    const activeRoutes = useUnit(route.$activeRoutes);
    return computed(() => activeRoutes.value.length > 0);
  }

  const isOpened = useUnit(route.$isOpened);
  return computed(() => Boolean(isOpened.value));
}
