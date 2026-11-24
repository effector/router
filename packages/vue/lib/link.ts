import { defineComponent, h, type PropType } from 'vue';
import type { QueryInput, Route, RouteOpenedPayload } from '@effector/router';
import { useLinkTo } from './use-link';

// `@__PURE__`: see router-provider.ts.
/**
 * @description Navigates user to provided route on click. Behaves like an
 * `<a>` element but uses `to` / `params` instead of `href`.
 * @link https://router.effector.dev/vue/link.html
 * @example ```ts
 * import { Link } from '@effector/router-vue';
 * import { routes } from '@shared/routing';
 *
 * // <Link :to="routes.settings">Settings</Link>
 * // <Link :to="routes.editPost" :params="{ id: post.id }">Edit post</Link>
 * ```
 */
export const Link = /* @__PURE__ */ defineComponent({
  name: 'Link',
  inheritAttrs: false,
  props: {
    to: { type: Object as PropType<Route<any>>, required: true },
    params: { type: Object as PropType<any>, default: undefined },
    replace: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
    query: { type: Object as PropType<QueryInput>, default: undefined },
    target: { type: String as PropType<string>, default: undefined },
    // Vue merges the click listeners of a wrapper and of its parent into an
    // array, so the prop accepts a function and an array.
    // Test: "runs the click listeners of a wrapper and of its parent".
    onClick: {
      type: [Function, Array] as PropType<(event: MouseEvent) => void>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    const link = useLinkTo(() => props.to);

    const handleClick = (event: MouseEvent) => {
      callClickListeners(props.onClick, event);

      // allow user to prevent navigation
      if (event.defaultPrevented) return;

      // Preserve native anchor behavior for non-primary clicks, downloads,
      // non-self targets, modified clicks, and cross-origin URLs.
      if (event.button !== 0 || attrs.download !== undefined) return;

      if (props.target && props.target !== '_self') return;

      // skip modified events (like cmd + click to open the link in new tab)
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      const href = new URL(
        (event.currentTarget as HTMLAnchorElement).href,
        window.location.href,
      );
      if (href.origin !== window.location.origin) return;

      event.preventDefault();

      link.onOpen({
        params: props.params ?? {},
        replace: props.replace,
        query: props.query,
      } as RouteOpenedPayload<any>);
    };

    return () =>
      h(
        'a',
        {
          ...attrs,
          target: props.target,
          href: link.build(props.params ?? undefined, props.query),
          onClick: handleClick,
        },
        slots.default?.(),
      );
  },
});

// A click listener is a function or, after Vue merged several of them, an
// array that may nest. The Solid binding does the same for its two listener
// forms (`callClickHandler`).
// After `stopImmediatePropagation()` in one listener the rest are skipped, as
// on a native element: Vue wraps the method the same way for an array of
// listeners (`patchStopImmediatePropagation` in @vue/runtime-dom).
// Test: "stopImmediatePropagation in a listener skips the listeners after it".
function callClickListeners(listener: unknown, event: MouseEvent) {
  const stop = event.stopImmediatePropagation.bind(event);
  let stopped = false;

  event.stopImmediatePropagation = () => {
    stop();
    stopped = true;
  };

  const call = (item: unknown) => {
    if (Array.isArray(item)) {
      item.forEach(call);
    } else if (typeof item === 'function' && !stopped) {
      item(event);
    }
  };

  call(listener);
}
