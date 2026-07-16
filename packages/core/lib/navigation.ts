import type { Event, EventCallable } from 'effector';

import type { Parser } from '@effector/router-paths';

import type { RouterTransition } from './adapters';
import type { NavigatePayload, Route, RouterControls } from './types';
import type { TransitionAttempt } from './transition-attempt';

export const navigationKind = Symbol('effector-router-navigation-kind');

export type InternalNavigatePayload = NavigatePayload & {
  [navigationKind]?: 'redirect';
};

export interface NavigationRequest {
  from: string;
  navigation: Required<Pick<NavigatePayload, 'path' | 'query'>> &
    Pick<NavigatePayload, 'replace'>;
  kind: 'command' | 'native';
  redirect: boolean;
  redirectDepth: number;
  transition?: RouterTransition;
}

export interface NavigationHold {
  attemptId: number;
  ownerId: number;
}

export interface InternalRouterControls extends RouterControls {
  locationInitialized: EventCallable<{
    pathname: string;
    query: import('./types').Query;
  }>;
  internal: {
    navigationStarted: Event<TransitionAttempt<NavigationRequest>>;
    hold: EventCallable<NavigationHold>;
    proceed: EventCallable<number>;
    cancel: EventCallable<number>;
    registerRoute: (route: Route<any>, parse: Parser<any>) => void;
    /** Returns `undefined` when the route is not owned by a Router. */
    routeMatches: (route: Route<any>, path: string) => boolean | undefined;
  };
}
