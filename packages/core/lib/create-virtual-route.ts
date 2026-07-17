import { createEvent, createStore, sample, type Store } from 'effector';

import { createRoute } from './create-route';
import type { LegacyVirtualRoute } from './types';

interface VirtualRouteOptions<T, TransformerResult> {
  $isPending?: Store<boolean>;
  transformer?: (payload: T) => TransformerResult;
}

/**
 * @deprecated Use `createRoute<Params>()` and ordinary Effector composition.
 * This compatibility factory keeps its transformer and external pending store
 * while delegating route activation to the shared pathless lifecycle.
 */
export function createVirtualRoute<T = void, TransformerResult = void>(
  options: VirtualRouteOptions<T, TransformerResult> = {},
): LegacyVirtualRoute<T, TransformerResult> {
  const {
    $isPending = createStore(false),
    transformer = (payload) => (payload ?? null) as TransformerResult,
  } = options;

  const route = createRoute<any>();
  const $payload = createStore<T>(undefined as T, { skipVoid: false });
  const $params = createStore<TransformerResult>(null as TransformerResult, {
    skipVoid: false,
  });
  const $isOpened = createStore(false);

  const open = createEvent<T>();
  const opened = createEvent<T>();
  const openedOnServer = createEvent<T>();
  const openedOnClient = createEvent<T>();
  const cancelled = createEvent();

  sample({
    clock: open,
    target: $payload,
  });

  sample({
    clock: open,
    fn: transformer,
    target: $params,
  });

  sample({
    clock: open,
    fn: (payload) => {
      const transformed = transformer(payload);

      return transformed === undefined ? undefined : { params: transformed };
    },
    target: route.open,
  });

  sample({
    clock: route.opened,
    source: $payload,
    target: opened,
  });

  sample({
    clock: route.opened,
    fn: () => true,
    target: $isOpened,
  });

  sample({
    clock: route.openedOnServer,
    source: $payload,
    target: openedOnServer,
  });

  sample({
    clock: route.openedOnClient,
    source: $payload,
    target: openedOnClient,
  });

  sample({
    clock: route.closed,
    fn: () => false,
    target: $isOpened,
  });

  return {
    '@@type': 'pathless-route',

    $params,
    $isOpened,
    $isPending,

    open,
    opened,
    openedOnClient,
    openedOnServer,

    close: route.close,
    closed: route.closed,
    cancelled,

    path: '',

    '@@unitShape': () => ({
      params: $params,
      isOpened: $isOpened,
      isPending: $isPending,

      onOpen: open,
      onClose: route.close,
    }),
  };
}
