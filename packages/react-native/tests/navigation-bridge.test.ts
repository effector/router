import type {
  NavigationContainerRefWithCurrent,
  ParamListBase,
} from '@react-navigation/native';
import { describe, expect, test, vi } from 'vitest';
import {
  readNavigationSnapshot,
  subscribeNavigation,
} from '../lib/navigation-bridge';

type EventName = 'ready' | 'state';

function createRef(ready = false) {
  let isReady = ready;
  const listeners = new Map<EventName, Set<() => void>>();
  let state = {
    key: 'root',
    index: 0,
    routes: [{ key: 'home', name: 'home' }],
  };
  let route = { key: 'home', name: 'home' };
  const ref = {
    isReady: () => isReady,
    getRootState: () => state,
    getCurrentRoute: () => route,
    addListener: (event: EventName, listener: () => void) => {
      const eventListeners = listeners.get(event) ?? new Set();
      eventListeners.add(listener);
      listeners.set(event, eventListeners);
      return () => eventListeners.delete(listener);
    },
  } as unknown as NavigationContainerRefWithCurrent<ParamListBase>;

  return {
    ref,
    setReady(value: boolean) {
      isReady = value;
    },
    setSnapshot(nextState: typeof state, nextRoute: typeof route) {
      state = nextState;
      route = nextRoute;
    },
    emit(event: EventName) {
      listeners.get(event)?.forEach((listener) => listener());
    },
    listenerCount(event: EventName) {
      return listeners.get(event)?.size ?? 0;
    },
  };
}

describe('app-owned navigation ref bridge', () => {
  test('does not read native state before ready and catches an already-ready ref', () => {
    const pending = createRef(false);
    expect(readNavigationSnapshot(pending.ref)).toBeUndefined();

    const ready = createRef(true);
    const snapshots: unknown[] = [];
    const unsubscribe = subscribeNavigation(ready.ref, (snapshot) => {
      snapshots.push(snapshot);
    });

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toEqual({
      state: { key: 'root', index: 0, routes: [{ key: 'home', name: 'home' }] },
      route: { key: 'home', name: 'home' },
    });
    unsubscribe();
  });

  test('reads a complete snapshot for ready and partial state notifications', () => {
    const native = createRef(false);
    const onSnapshot = vi.fn();
    const unsubscribe = subscribeNavigation(native.ref, onSnapshot);

    expect(onSnapshot).not.toHaveBeenCalled();
    native.setReady(true);
    native.setSnapshot(
      {
        key: 'root-2',
        index: 1,
        routes: [{ key: 'profile', name: 'profile' }],
      },
      { key: 'profile', name: 'profile' },
    );
    native.emit('ready');
    native.emit('state');

    expect(onSnapshot).toHaveBeenCalledTimes(2);
    expect(onSnapshot).toHaveBeenLastCalledWith({
      state: {
        key: 'root-2',
        index: 1,
        routes: [{ key: 'profile', name: 'profile' }],
      },
      route: { key: 'profile', name: 'profile' },
    });
    unsubscribe();
  });

  test('removes both native listeners on cleanup', () => {
    const native = createRef(true);
    const unsubscribe = subscribeNavigation(native.ref, () => {});

    expect(native.listenerCount('ready')).toBe(1);
    expect(native.listenerCount('state')).toBe(1);
    unsubscribe();
    expect(native.listenerCount('ready')).toBe(0);
    expect(native.listenerCount('state')).toBe(0);
  });
});
