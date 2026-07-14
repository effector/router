import type { Route, Router, OpenPayloadBase } from '@effector/router';
import type { AnchorHTMLAttributes, Component } from 'vue';

export interface RouteView {
  route: Route<any> | Router;
  view: Component;
  children?: RouteView[];
}

interface CreateBaseRouteViewProps<T extends object | void = void> {
  route: Route<T> | Router;
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
