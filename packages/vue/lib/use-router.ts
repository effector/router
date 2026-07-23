import { inject } from 'vue';
import { useUnit } from 'effector-vue/composition';
import { RouterInjectionKey } from './context';

/**
 * @description Get the raw router instance from the provider
 * @returns Router
 */
export function useRouterContext() {
  const router = inject(RouterInjectionKey, null);

  if (!router) {
    throw new Error(
      '[useRouter] Router not found. Add RouterProvider in app root',
    );
  }

  return router;
}

/**
 * @description Use reactive router state from the provider. Works only inside `<RouterProvider>`
 * @returns Reactive router units (path, query, activeRoutes, ...)
 * @link https://router.effector.dev/vue/use-router.html
 */
export function useRouter() {
  return useUnit(useRouterContext());
}
