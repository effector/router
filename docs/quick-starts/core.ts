import {
  createRouter,
  createVirtualRoute,
} from '../../packages/core/lib/index';

export function createCoreQuickStart() {
  const home = createVirtualRoute();
  const profile = createVirtualRoute<{ id: string }>();
  const router = createRouter({ routes: [] });

  return { home, profile, router };
}
