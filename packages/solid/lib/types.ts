import type { Route, OpenPayloadBase, Router } from '@effector/router';
import type { Component, JSX } from 'solid-js';

type LayoutComponent = Component<{ children: JSX.Element }>;
export const layoutGroup = Symbol('effector-router-solid-layout-group');
export interface LayoutGroup {
  token: number;
  layout: LayoutComponent;
}
export const routeViewFallback = Symbol('effector-router-solid-fallback');
/** @internal Components a view renders while its route is not opened. */
export interface RouteViewFallback {
  loading?: Component;
  closed?: Component;
}
type RouteViewWithLayout = RouteView & { layout?: LayoutComponent };
type RouteViewTarget = Pick<Route<any>, '$isOpened'>;

interface CreateBaseRouteViewProps<T extends object | void = void> {
  route: Route<T> | RouteViewTarget | Router;
  layout?: LayoutComponent;
  children?: RouteViewWithLayout[];
  closed?: Component;
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

export interface RouteView {
  route: RouteViewTarget | Router;
  view: Component;
  children?: RouteView[];
  [layoutGroup]?: LayoutGroup;
  [routeViewFallback]?: RouteViewFallback;
}

type AnchorProps = Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

type BaseLinkProps<Params extends object | void = void> = {
  to: Route<Params>;
  children?: JSX.Element;
  activeClass?: string;
} & AnchorProps &
  OpenPayloadBase;

export type LinkProps<Params extends object | void = void> = Params extends
  Record<string, never> | void | undefined
  ? BaseLinkProps<Params> & { params?: Params }
  : BaseLinkProps<Params> & { params: Params };
