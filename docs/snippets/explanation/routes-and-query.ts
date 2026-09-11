import { createEffect, sample } from 'effector';
import { z } from 'zod';
import {
  chainRoute,
  createRoute,
  createRouter,
  createRouterControls,
  trackQuery,
  type Query,
} from '@effector/router';

export const controls = createRouterControls();

export const routes = {
  product: createRoute({ path: '/products/:id' }),
};

export const router = createRouter({
  routes: [routes.product],
  controls,
});

const checkSessionFx = createEffect(async () => undefined);

export const authorized = chainRoute({
  route: routes.product,
  beforeOpen: checkSessionFx,
});

export const loadProductFx = createEffect(
  async (_params: { id: string }) => undefined,
);

sample({
  clock: authorized.opened,
  source: routes.product.$params,
  target: loadProductFx,
});

export const loadListFx = createEffect(async (_query: Query) => undefined);

sample({
  clock: authorized.opened,
  source: controls.$query,
  target: loadListFx,
});

sample({
  clock: controls.$query,
  filter: authorized.$isOpened,
  target: loadListFx,
});

export const filters = trackQuery({
  controls,
  routes: [routes.product],
  parameters: z.object({
    foo: z.string(),
  }),
});

sample({
  clock: filters.entered,
  target: createEffect(async (_params: { foo: string }) => undefined),
});

void router;
