import type { History, Transition } from 'history';

import type { RouterLocation, RouterTransition } from './types';

type ProjectLocation = (location: History['location']) => RouterLocation;
type BlockCallback = (transition: RouterTransition) => void;

interface Subscriber {
  callback: BlockCallback;
  projectLocation: ProjectLocation;
}

interface PendingTransition {
  id: number;
  transition: Transition;
  waiting: Set<number>;
}

interface HistoryBlockCoordinator {
  block: (
    projectLocation: ProjectLocation,
    callback: BlockCallback,
  ) => (() => void) & { unsubscribe: () => void };
  runWithoutBlocking: (operation: () => void) => void;
}

const coordinators = new WeakMap<History, HistoryBlockCoordinator>();

/**
 * Owns the single physical blocker for a History instance.
 *
 * Multiple RouterAdapters may project the same browser history into different
 * routing planes. A native transition is retried only after every current
 * projection has released it; adapter commands bypass the shared physical
 * blocker because their controls already completed the pre-commit lifecycle.
 */
export function getHistoryBlockCoordinator(
  history: History,
): HistoryBlockCoordinator {
  const existing = coordinators.get(history);

  if (existing) {
    return existing;
  }

  let lastSubscriberId = 0;
  let lastTransitionId = 0;
  let unblock: (() => void) | null = null;
  let bypassDepth = 0;
  let pending: PendingTransition | null = null;
  const subscribers = new Map<number, Subscriber>();

  const removePhysicalBlocker = () => {
    const stop = unblock;
    unblock = null;
    stop?.();
  };

  const runWithoutBlocking = (operation: () => void) => {
    if (bypassDepth > 0) {
      operation();
      return;
    }

    // A committed adapter command supersedes any older native transition.
    // Its retry callbacks become stale and must not mutate history later.
    pending = null;
    bypassDepth++;
    removePhysicalBlocker();

    try {
      operation();
    } finally {
      bypassDepth--;
      subscribePhysicalBlocker();
    }
  };

  const retryWhenReady = () => {
    if (!pending || pending.waiting.size > 0) {
      return;
    }

    const { transition } = pending;
    pending = null;
    runWithoutBlocking(() => transition.retry());
  };

  const approve = (transitionId: number, subscriberId: number) => {
    if (pending?.id !== transitionId) {
      return;
    }

    pending.waiting.delete(subscriberId);
    retryWhenReady();
  };

  const handleBlockedTransition = (transition: Transition) => {
    const currentSubscribers = [...subscribers.entries()];
    const current: PendingTransition = {
      id: ++lastTransitionId,
      transition,
      waiting: new Set(
        currentSubscribers.map(([subscriberId]) => subscriberId),
      ),
    };

    pending = current;

    for (const [subscriberId, subscriber] of currentSubscribers) {
      if (pending?.id !== current.id || !subscribers.has(subscriberId)) {
        continue;
      }

      subscriber.callback({
        action: transition.action,
        location: subscriber.projectLocation(transition.location),
        retry: () => approve(current.id, subscriberId),
      });
    }

    retryWhenReady();
  };

  function subscribePhysicalBlocker() {
    if (unblock || bypassDepth > 0 || subscribers.size === 0) {
      return;
    }

    unblock = history.block(handleBlockedTransition);
  }

  const block: HistoryBlockCoordinator['block'] = (
    projectLocation,
    callback,
  ) => {
    const subscriberId = ++lastSubscriberId;
    subscribers.set(subscriberId, { callback, projectLocation });
    subscribePhysicalBlocker();

    const unsubscribe = () => {
      if (!subscribers.delete(subscriberId)) {
        return;
      }

      if (pending?.waiting.delete(subscriberId)) {
        retryWhenReady();
      }

      if (subscribers.size === 0) {
        pending = null;
        removePhysicalBlocker();
      }
    };

    return Object.assign(unsubscribe, { unsubscribe });
  };

  const coordinator = { block, runWithoutBlocking };
  coordinators.set(history, coordinator);

  return coordinator;
}
