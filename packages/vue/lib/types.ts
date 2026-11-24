import type {
  NavigatePayload,
  OpenPayloadBase,
  Query,
  QueryInput,
  Route,
  RouteOpenPayload,
  Router,
} from '@effector/router';
import type {
  AnchorHTMLAttributes,
  AsyncComponentOptions,
  Component,
  ComponentPublicInstance,
  HydrationStrategy,
  PublicProps,
  Ref,
  VNode,
} from 'vue';

type RouteViewTarget = Pick<Route<any>, '$isOpened'>;
// A registered symbol with a version, as the keys in context.ts: `withLayout`
// of one copy of the package marks a view for the routes view of another.
// Test: "withLayout from one copy and a routes view from the other keep the
// layout".
export const layoutGroup = Symbol.for('@effector/router-vue:layout-group:1');
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

/** What the default slot of `RoutesView` and `<Outlet />` receives. */
export interface RouteViewSlotProps {
  /**
   * Vnode of the current view, for `<component :is="Component" />`. For a view
   * of a `withLayout` group it is the layout with the page inside. `null` when
   * there is nothing to render.
   */
  Component: VNode | null;
  /** The current view. `null` for `otherwise` and when nothing is opened. */
  view: RouteView | null;
}

/** What `createLazyRouteView` returns. */
export interface LazyRouteView extends RouteView {
  /**
   * Loads the chunk of the view ahead of its render. A view mounted after the
   * returned promise resolved renders the page at once, without `fallback`.
   * The promise rejects when the loader rejects or throws; a later call loads
   * again.
   */
  preload(): Promise<void>;
}

interface CreateBaseRouteViewProps<T extends object | void = void> {
  route: Route<T> | RouteViewTarget | Router;
  layout?: Component;
  children?: RouteView[];
  /**
   * Component name of the view, for `KeepAlive include` and devtools. Without
   * it a lazy view is `LazyRouteView` and a plain view keeps its own name.
   */
  name?: string;
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
  /** Class added while the link is active. */
  activeClass?: string;
  /** Class added while the link is exactly active. */
  exactActiveClass?: string;
} & AnchorProps &
  OpenPayloadBase;

type RouteParams<R> = R extends Route<infer Params> ? Params : never;

/**
 * Props of `Link` for the route type `R`. `params` is required when the route
 * has a required param. It is optional when the route has no params or only
 * optional ones, such as `/tags/:tag?`: `{} extends Params` holds exactly
 * when no key of `Params` is required. 0.1.0 never required `params`, so such
 * links keep compiling.
 * Test: "Link infers params from the route in TSX".
 */
export type LinkPropsOf<R extends Route<any>> = Omit<
  BaseLinkProps<any>,
  'to'
> & { to: R } & ([RouteParams<R>] extends [
    Record<string, never> | void | undefined,
  ]
    ? { params?: RouteParams<R> }
    : {} extends RouteParams<R>
      ? { params?: RouteParams<R> }
      : { params: RouteParams<R> });

/**
 * The type of `Link`: a component whose props depend on the route in `to`.
 *
 * `defineComponent` cannot express this, so the type is written by hand and
 * `Link` is cast to it. The React binding types its `Link` the same way
 * (`ForwardedLink`), and `RouterLink` of vue-router is typed by a hand-written
 * constructor as well.
 *
 * - The type parameter is the route, not its params. `h()` reads a generic
 *   component with the type parameter replaced by its constraint, and
 *   `Route<any>` accepts every `h(Link, ...)` call. `h()` cannot check
 *   `params`.
 * - `$props` is written out: TSX and SFC templates infer `R` from it.
 * - `$slots` declares the default slot for templates and TSX.
 * Tests: "Link infers params from the route in TSX", "h(Link) calls of 0.1.0
 * keep compiling", "Link declares the default slot".
 */
export interface LinkComponent {
  new <R extends Route<any>>(
    props: LinkPropsOf<R> & PublicProps,
  ): ComponentPublicInstance & {
    $props: LinkPropsOf<R> & PublicProps;
    $slots: { default?: (props: LinkSlotProps) => VNode[] };
  };
}

/** What the default slot of `Link` receives. */
export interface LinkSlotProps {
  /** URL of the link, the `href` of the rendered anchor. */
  href: string;
  /** `isActive` of `useLink`. */
  isActive: boolean;
  /** `isExactActive` of `useLink`. */
  isExactActive: boolean;
  /** `navigate` of `useLink`, with `replace` of the link. */
  navigate: (event?: MouseEvent) => void;
}

export type LinkProps<Params extends object | void = void> = Params extends
  Record<string, never> | void | undefined
  ? BaseLinkProps<Params> & { params?: Params }
  : BaseLinkProps<Params> & { params: Params };

/**
 * What `useRouter` returns: the unit shape of the router, with stores as
 * readonly refs and events as functions. Written by hand so that the published
 * types do not depend on type names exported by `effector-vue`.
 */
export interface UseRouterReturn {
  query: Readonly<Ref<Query>>;
  path: Readonly<Ref<string | null>>;
  activeRoutes: Readonly<Ref<Route<any>[]>>;
  onBack: () => void;
  onForward: () => void;
  /** Returns its payload, as an Effector event does. */
  onNavigate: (payload: NavigatePayload) => NavigatePayload;
}

/** What `useLink` returns. */
export interface UseLinkReturn<T extends object | void = void> {
  build: (params?: T, query?: QueryInput) => string;
  /** Returns its payload, as an Effector event does. */
  onOpen: (payload: RouteOpenPayload<T>) => RouteOpenPayload<T>;
  /** URL built from `params` and `query` passed to `useLink`. */
  href: Readonly<Ref<string>>;
  /**
   * The route is opened and its params contain the params passed to
   * `useLink`. Stays `true` while a child route is opened.
   */
  isActive: Readonly<Ref<boolean>>;
  /** `isActive`, and the route is the last one matched by the current path. */
  isExactActive: Readonly<Ref<boolean>>;
  /**
   * Opens the route with `params` and `query` passed to `useLink`. With a
   * click event it leaves modified, non-primary, prevented, download,
   * non-`_self` and cross-origin clicks to the browser.
   */
  navigate: (event?: MouseEvent) => void;
}
