import type { Route, OpenPayloadBase, Router } from '@effector/router';
import type { Component, JSX } from 'solid-js';

type LayoutComponent = Component<{ children: JSX.Element }>;
export const layoutGroup = Symbol('effector-router-solid-layout-group');
export interface LayoutGroup {
  token: number;
  layout: LayoutComponent;
}
type RouteViewWithLayout = RouteView & { layout?: LayoutComponent };
type RouteViewTarget = Pick<Route<any>, '$isOpened'>;

interface CreateBaseRouteViewProps<T extends object | void = void> {
  route: Route<T> | RouteViewTarget | Router;
  layout?: LayoutComponent;
  children?: RouteViewWithLayout[];
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
  fallback?: Component;
}

export interface RouteView {
  route: RouteViewTarget | Router;
  view: Component;
  children?: RouteView[];
  [layoutGroup]?: LayoutGroup;
}

type AnchorProps = Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

type BaseLinkProps<Params extends object | void = void> = {
  to: Route<Params>;
  children?: JSX.Element;
  activeClass?: string;
} & AnchorProps &
  OpenPayloadBase;

export type LinkProps<Params extends object | void = void> = Params extends
  | Record<string, never>
  | void
  | undefined
  ? BaseLinkProps<Params> & { params?: Params }
  : BaseLinkProps<Params> & { params: Params };
