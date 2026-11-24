import type { Route, Router, OpenPayloadBase } from '@effector/router';
import type {
  AnchorHTMLAttributes,
  AsyncComponentOptions,
  Component,
  HydrationStrategy,
} from 'vue';

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
  /** Rendered while the loader is pending. */
  fallback?: Component;
  /**
   * Rendered when the loader rejects or `timeout` passes. Receives the error
   * as the `error` prop.
   */
  error?: Component;
  /** Called when the loader rejects. Call `retry()` to load again. */
  onError?: AsyncComponentOptions['onError'];
  /** Milliseconds before a pending loader counts as failed. Default: none. */
  timeout?: number;
  /** Milliseconds before `fallback` shows. Default: `0`. */
  delay?: number;
  /**
   * `true` lets an ancestor `<Suspense>` wait for the loader and show its own
   * fallback. Default: `false`, so `fallback` of this view shows.
   */
  suspensible?: boolean;
  /** Hydration strategy, passed to `defineAsyncComponent` as it is. */
  hydrate?: HydrationStrategy;
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
