import { useContext } from 'solid-js';
import { RouterProviderContext } from './context';
import { useUnit } from 'effector-solid';

export function useRouterContext() {
  const context = useContext(RouterProviderContext);

  if (!context) {
    throw new Error(
      '[useRouter] Router not found. Add RouterProvider in app root',
    );
  }

  return context;
}

/**
 * @description Use router from provider
 * @returns Router unit shape (Solid accessors)
 * @link https://router.effector.dev/solid/use-router.html
 */
export function useRouter() {
  return useUnit(useRouterContext());
}
