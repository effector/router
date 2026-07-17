import type { Route, OpenPayloadBase, Router } from '@effector/router';
import type { AnchorHTMLAttributes, ComponentType, FC, ReactNode } from 'react';

type LayoutComponent = ComponentType<{ children: ReactNode }>;
export const layoutGroup = Symbol('effector-router-react-layout-group');
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
  view: ComponentType;
}

export interface CreateLazyRouteViewProps<
  T extends object | void = void,
> extends CreateBaseRouteViewProps<T> {
  view: () => Promise<{ default: ComponentType }>;
  fallback?: ComponentType;
}

export interface RouteView {
  route: RouteViewTarget | Router;
  view: FC;
  children?: RouteView[];
  [layoutGroup]?: LayoutGroup;
}

type AnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

type BaseLinkProps<Params extends object | void = void> = {
  to: Route<Params>;
  children?: ReactNode;
} & AnchorProps &
  OpenPayloadBase;

export type LinkProps<Params extends object | void = void> = Params extends
  | Record<string, never>
  | void
  | undefined
  ? BaseLinkProps<Params> & { params?: Params }
  : BaseLinkProps<Params> & { params: Params };
