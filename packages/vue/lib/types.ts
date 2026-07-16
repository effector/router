import type { Route, Router, OpenPayloadBase } from '@effector/router';
import type { AnchorHTMLAttributes, Component } from 'vue';

type RouteViewTarget = Pick<Route<any>, '$isOpened'>;
export const layoutGroup = Symbol('effector-router-vue-layout-group');
export interface LayoutGroup {
  token: number;
  layout: Component;
}

export interface RouteView {
  route: RouteViewTarget | Router;
  view: Component;
  children?: RouteView[];
  [layoutGroup]?: LayoutGroup;
}

interface CreateBaseRouteViewProps<T extends object | void = void> {
  route: Route<T> | RouteViewTarget | Router;
  layout?: Component;
  children?: RouteView[];
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

type AnchorProps = Omit<AnchorHTMLAttributes, 'href'>;

type BaseLinkProps<Params extends object | void = void> = {
  to: Route<Params>;
} & AnchorProps &
  OpenPayloadBase;

export type LinkProps<Params extends object | void = void> = Params extends
  | Record<string, never>
  | void
  | undefined
  ? BaseLinkProps<Params> & { params?: Params }
  : BaseLinkProps<Params> & { params: Params };
