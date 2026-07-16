import { createRouter, createRoute } from '../../packages/core/lib/index';

export function createCoreQuickStart(): any {
  const home = createRoute();
  const profile = createRoute<{ id: string }>();
  const router = createRouter({ routes: [] });

  return { home, profile, router };
}
