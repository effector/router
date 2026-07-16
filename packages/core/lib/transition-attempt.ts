import { createEvent, createStore, sample } from 'effector';

export interface TransitionAttempt<T> {
  id: number;
  payload: T;
}

interface AttemptCoordinatorConfig<T> {
  concurrency: 'ignore' | 'takeLatest';
  shouldReplace?: (current: TransitionAttempt<T>, next: T) => boolean;
}

let lastAttemptId = 0;

/** Internal correlation primitive shared by navigation and route chains. */
export function createAttemptCoordinator<T>(
  config: AttemptCoordinatorConfig<T>,
) {
  const request = createEvent<T>();
  const complete = createEvent<number>();
  const cancel = createEvent<number>();

  const $current = createStore<TransitionAttempt<T> | null>(null, {
    serialize: 'ignore',
  });

  const started = sample({
    clock: request,
    source: $current,
    filter: (current, next) =>
      current === null ||
      config.concurrency === 'takeLatest' ||
      Boolean(config.shouldReplace?.(current, next)),
    fn: (_, payload): TransitionAttempt<T> => ({
      id: ++lastAttemptId,
      payload,
    }),
  });

  const completed = sample({
    clock: complete,
    source: $current,
    filter: (current, id): current is TransitionAttempt<T> =>
      current?.id === id,
    fn: (current) => current,
  });

  const cancelled = sample({
    clock: cancel,
    source: $current,
    filter: (current, id): current is TransitionAttempt<T> =>
      current?.id === id,
    fn: (current) => current,
  });

  $current.on(started, (_, attempt) => attempt).reset([completed, cancelled]);

  return {
    $current,
    request,
    started,
    complete,
    completed,
    cancel,
    cancelled,
  };
}
