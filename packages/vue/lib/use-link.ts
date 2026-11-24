import {
  stringifyQuery,
  type InternalRoute,
  type QueryInput,
  type Route,
  type RouteOpenPayload,
} from '@effector/router';
import { scopeBind } from 'effector';
import { useProvidedScope, useUnit } from 'effector-vue/composition';
import { computed, toRaw, toRef, toValue, type MaybeRefOrGetter } from 'vue';
import type { UseLinkReturn } from './types';
import { useUnitsOf } from './use-is-opened';
import { useRouterContext } from './use-router';

/**
 * @description Imperative navigation helper. Resolves a route to its URL
 * builder, its bound `onOpen` event and the reactive state of a link to it:
 * `href`, `isActive`, `isExactActive` and `navigate`. The route, `params` and
 * `query` may be refs or getters. The order of the arguments is the one of
 * the React and Solid bindings. Works only inside `<RouterProvider>`.
 * @link https://router.effector.dev/vue/use-link.html
 */
export function useLink<T extends object | void = void>(
  to: MaybeRefOrGetter<Route<T>>,
  params?: MaybeRefOrGetter<T | undefined>,
  query?: MaybeRefOrGetter<QueryInput | undefined>,
): UseLinkReturn<T> {
  return useLinkTo(
    to,
    () => toValue(params),
    () => toValue(query),
  );
}

/**
 * @internal `useLink` with `params` and `query` as getters, plus `replace`
 * for `<Link>`.
 */
export function useLinkTo<T extends object | void = void>(
  to: MaybeRefOrGetter<Route<T>>,
  getParams: () => T | undefined,
  getQuery: () => QueryInput | undefined,
  getReplace: () => boolean | undefined = () => undefined,
): UseLinkReturn<T> {
  const getTo = () => toValue(to);
  const router = useRouterContext();
  const [currentQuery, currentPath] = useUnit([router.$query, router.$path]);
  // Resolved here, in setup: a click handler has no injection context.
  const scope = useProvidedScope();

  const resolve = (to: Route<T>) => {
    // `to` may arrive as a Vue reactive proxy (e.g. from component props);
    // unwrap it so the identity check against knownRoutes works.
    const route = toRaw(to);

    const target = router.knownRoutes.find(
      // `known` may itself be a reactive proxy (e.g. when the router is provided
      // through deeply-reactive props), so compare the raw targets.
      ({ route: known }) =>
        toRaw(known) === (route as unknown as InternalRoute<any>),
    );

    if (!target) return undefined;

    const { onOpen } = route['@@unitShape']();

    return {
      target,
      onOpen: scope ? scopeBind(onOpen, { scope }) : onOpen,
    };
  };

  const resolved = computed(() => resolve(getTo()));

  // Vue-specific: a computed whose getter threw returns its previous value on
  // the next read. So the getter above returns `undefined` for a route outside
  // the router, and the error is thrown here, on every call.
  // Test: "build() throws on every call after the route leaves the router".
  const link = () => {
    const found = resolved.value;

    if (!found) {
      throw new Error(
        '[useLink] Route not found. Maybe it is not passed into createRouter?',
      );
    }

    return found;
  };

  // A route outside the router throws here, in setup, as in 0.1.0. Without
  // this call it would throw on the first `build()` or `onOpen()`.
  // Test: "useLink throws in setup for a route outside the router".
  link();

  const build = (params?: T, query?: QueryInput) => {
    const path = link().target.build(params);
    const effectiveQuery = query === undefined ? currentQuery.value : query;
    const search = effectiveQuery ? stringifyQuery(effectiveQuery) : '';

    return search ? `${path}?${search}` : path;
  };

  // `scopeBind` types its function as returning nothing, while a bound
  // event returns its payload, so the payload is returned here.
  // Test: "useLink onOpen opens the route and returns its payload".
  const onOpen = (payload: RouteOpenPayload<T>) => {
    link().onOpen(payload);

    return payload;
  };

  // `$isOpened` of the route, then `$params` of the route and of each parent,
  // the route first.
  const state = useUnitsOf(to, (route) => {
    const chain: InternalRoute<any>[] = [];

    for (
      let current = route as unknown as InternalRoute<any> | undefined;
      current;
      current = current.parent as InternalRoute<any> | undefined
    ) {
      chain.push(current);
    }

    return [route.$isOpened, ...chain.map((item) => item.$params)];
  });

  const isActive = computed(() => {
    const [isOpened, ...chainParams] = state.value.refs;

    if (!isOpened.value) return false;

    // A route opened as a parent keeps only the params of its own path, so
    // the params of the whole parent chain are merged.
    // Test: "a link to a middle route is active while its child is opened".
    const current = Object.assign(
      {},
      ...chainParams.map((params) => params.value),
    ) as Record<string, unknown>;
    const wanted = (getParams() ?? {}) as Record<string, unknown>;

    // Only the params the link names are compared, and a param set to
    // `undefined` or `null` counts as not named.
    // Test: "a link without a param is active, and exactly active only with
    // all params".
    return Object.keys(wanted).every(
      (key) => wanted[key] == null || sameParam(current[key], wanted[key]),
    );
  });

  const isExactActive = computed(() => {
    const path = currentPath.value;

    // `$path` changes before `beforeOpen` of the route ends, and `isActive`
    // waits for the route to open.
    // Test: "a link is not active while beforeOpen of its route is pending".
    if (!isActive.value || path === null) return false;

    // The parser matches the whole path, so a match means that this route is
    // the last one in the URL and none of its children is opened.
    const match = resolved.value?.target.parse(path);

    if (!match) return false;

    const current = (match.params ?? {}) as Record<string, unknown>;
    const wanted = (getParams() ?? {}) as Record<string, unknown>;

    // Unlike `isActive`, every param of the URL has to equal the param of the
    // link, so the keys of both sides are walked.
    // Test: "a link without a param is active, and exactly active only with
    // all params".
    return [...Object.keys(current), ...Object.keys(wanted)].every((key) =>
      sameParam(current[key], wanted[key]),
    );
  });

  return {
    build,
    onOpen,
    // A getter ref, not a computed: `build` throws for a missing required
    // param, and a computed would return its previous value on the next read
    // (see `link` above).
    // Test: "href throws on every read while a required param is missing".
    href: toRef(() => build(getParams(), getQuery())),
    isActive,
    isExactActive,
    navigate: (event) => {
      if (event) {
        if (!isPlainClick(event) || !isOwnPage(event.currentTarget)) return;

        event.preventDefault();
      }

      onOpen({
        params: getParams() ?? {},
        query: getQuery(),
        replace: getReplace(),
      } as RouteOpenPayload<T>);
    },
  };
}

// A click that the link handles itself: the primary button, no modifier key,
// and no listener called `preventDefault()`. Other clicks keep the native
// behavior, for example "open in a new tab".
// Test: "navigate(event) leaves a modified or prevented click to the browser".
function isPlainClick(event: MouseEvent): boolean {
  return !(
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  );
}

// The element of a click as far as it is an anchor. `navigate` may be bound
// to a button or any other element: it has no `href`, and the checks of an
// anchor are skipped.
// Tests: "navigate(event) leaves a cross-origin or download anchor to the
// browser", "navigate(event) on an element that is not an anchor opens the
// route".
function isOwnPage(element: EventTarget | null): boolean {
  const anchor = element as Partial<HTMLAnchorElement> | null;

  if (!anchor || typeof anchor.href !== 'string') return true;

  if (anchor.hasAttribute?.('download')) return false;
  if (anchor.target && anchor.target !== '_self') return false;

  return (
    new URL(anchor.href, window.location.href).origin === window.location.origin
  );
}

// Core keeps path params as they are in the URL, and a browser history gives
// the path percent-encoded: `$params` holds `J%C3%BCrgen` where the link has
// `Jürgen`. Both sides are decoded before they are compared. A malformed
// sequence such as `%E0%A4%A` makes `decodeURIComponent` throw (issue #129),
// and the value is then compared as it is.
// Tests: "a link with a non-ASCII param is active on an encoded path", "a
// malformed percent sequence in the path does not throw".
function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

// Params of a link against params of the URL: a missing value equals `null`
// and `undefined`, arrays are compared item by item, and a number equals its
// string, because the parser returns numbers for `<number>` params.
// Test: "number and array params are compared with the params of the URL".
function sameParam(current: unknown, wanted: unknown): boolean {
  if (current == null || wanted == null) return current == wanted;

  if (Array.isArray(current) || Array.isArray(wanted)) {
    return (
      Array.isArray(current) &&
      Array.isArray(wanted) &&
      current.length === wanted.length &&
      current.every((item, index) => sameParam(item, wanted[index]))
    );
  }

  // What is left is a string or a number.
  return (
    decodeParam(String(current as string | number)) ===
    decodeParam(String(wanted as string | number))
  );
}
