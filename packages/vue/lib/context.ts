import type { InjectionKey } from 'vue';
import type { Router } from '@effector/router';
import type { RouteView } from './types';

export const RouterInjectionKey: InjectionKey<Router> =
  Symbol('effector-router');

/** Reads the children of the view rendered above, at the time of the call. */
export const OutletInjectionKey: InjectionKey<() => RouteView[]> = Symbol(
  'effector-router-outlet',
);
