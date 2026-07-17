import type {
  NavigationContainerRefWithCurrent,
  ParamListBase,
} from '@react-navigation/native';

export type NavigationSnapshot<
  ParamList extends ParamListBase = ParamListBase,
> = {
  state: ReturnType<
    NavigationContainerRefWithCurrent<ParamList>['getRootState']
  >;
  route: ReturnType<
    NavigationContainerRefWithCurrent<ParamList>['getCurrentRoute']
  >;
};

/** Read a complete native snapshot only after the app-owned ref is ready. */
export function readNavigationSnapshot<
  ParamList extends ParamListBase = ParamListBase,
>(
  navigationRef: NavigationContainerRefWithCurrent<ParamList>,
): NavigationSnapshot<ParamList> | undefined {
  if (!navigationRef.isReady()) {
    return undefined;
  }

  return {
    state: navigationRef.getRootState(),
    route: navigationRef.getCurrentRoute(),
  };
}

/**
 * Subscribe to native readiness/state notifications. The state event payload
 * is intentionally ignored: React Navigation can emit partial state, so every
 * notification reads the complete snapshot from the app-owned ref.
 */
export function subscribeNavigation<
  ParamList extends ParamListBase = ParamListBase,
>(
  navigationRef: NavigationContainerRefWithCurrent<ParamList>,
  onSnapshot: (snapshot: NavigationSnapshot<ParamList>) => void,
): () => void {
  const notify = () => {
    const snapshot = readNavigationSnapshot(navigationRef);
    if (snapshot) {
      onSnapshot(snapshot);
    }
  };

  const readySubscription = navigationRef.addListener('ready', notify);
  const stateSubscription = navigationRef.addListener('state', notify);

  // NavigationContainer may have emitted `ready` before this component was
  // mounted. Check the ref after subscribing so that transition is not missed.
  notify();

  return () => {
    readySubscription();
    stateSubscription();
  };
}
