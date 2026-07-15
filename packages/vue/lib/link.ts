import { defineComponent, h, type PropType } from 'vue';
import type { QueryInput, Route, RouteOpenedPayload } from '@effector/router';
import { useLink } from './use-link';

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
export const Link = defineComponent({
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
    onClick: {
      type: Function as PropType<(event: MouseEvent) => void>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    const link = useLink(props.to);

    const handleClick = (event: MouseEvent) => {
      props.onClick?.(event);

      // allow user to prevent navigation
      if (event.defaultPrevented) return;

      // let browser handle "_blank" target and etc
      if (props.target && props.target !== '_self') return;

      // skip modified events (like cmd + click to open the link in new tab)
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
        return;
      }

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
