import type { Route, Router, OpenPayloadBase } from '@effector/router';
import type { AnchorHTMLAttributes, Component } from 'vue';

type RouteViewTarget = Pick<Route<any>, '$isOpened'>;
export const layoutGroup = Symbol('effector-router-vue-layout-group');
export interface LayoutGroup {
  token: number;
  layout: Component;
}

export const routeViewFallback = Symbol('effector-router-vue-fallback');
/** @internal Components a view renders while its route is not opened. */
export interface RouteViewFallback {
  loading?: Component;
  otherwise?: Component;
}

export interface RouteView {
  route: RouteViewTarget | Router;
  view: Component;
  children?: RouteView[];
  [layoutGroup]?: LayoutGroup;
  [routeViewFallback]?: RouteViewFallback;
}

interface CreateBaseRouteViewProps<T extends object | void = void> {
  route: Route<T> | RouteViewTarget | Router;
  layout?: Component;
  children?: RouteView[];
  otherwise?: Component;
  loading?: Component;
}

export interface CreateRouteViewProps<
  T extends object | void = void,
> extends CreateBaseRouteViewProps<T> {
  view: Component;
}

export interface CreateLazyRouteViewProps<
  T extends object | void = void,
> extends CreateBaseRouteViewProps<T> {
  view: () => Promise<{ default: Component }>;
  /**
   * @deprecated Use `loading` instead. It renders for both waits — the pending
   * route and the chunk request — so the routes view fallback no longer
   * flashes while the chunk loads.
   */
  fallback?: Component;
}

type AnchorProps = Omit<AnchorHTMLAttributes, 'href'>;

type BaseLinkProps<Params extends object | void = void> = {
  to: Route<Params>;
} & AnchorProps &
  OpenPayloadBase;

export type LinkProps<Params extends object | void = void> = Params extends
  Record<string, never> | void | undefined
  ? BaseLinkProps<Params> & { params?: Params }
  : BaseLinkProps<Params> & { params: Params };
