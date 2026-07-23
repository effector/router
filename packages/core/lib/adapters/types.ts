import type { Subscription } from 'effector';

export interface RouterLocation {
  pathname: string;
  search: string;
  hash: string;
}

/**
 * Navigation target.
 *
 * A string is a full path following the `history` convention —
 * `pathname[?search][#hash]` — and is equivalent to the matching
 * `Partial<RouterLocation>` object. Omitted object fields fall back to
 * `/` (pathname) or empty strings.
 */
export type To = string | Partial<RouterLocation>;

type ListenCallback = (location: RouterLocation) => void;

export type RouterAction = 'POP' | 'PUSH' | 'REPLACE';

export interface RouterTransition {
  action: RouterAction;
  location: RouterLocation;
  retry: () => void;
}

type BlockCallback = (transition: RouterTransition) => void;

export interface RouterAdapter {
  location: RouterLocation;

  push: (to: To) => void;
  replace: (to: To) => void;

  goBack: () => void;
  goForward: () => void;

  listen: (callback: ListenCallback) => Subscription;

  /**
   * Optional native transition interception. Without it, router commands can
   * still be held, but browser POP transitions cannot.
   */
  block?: (callback: BlockCallback) => Subscription;
}
