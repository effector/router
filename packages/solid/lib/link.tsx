import type { Route, RouteOpenPayload } from '@effector/router';
import { splitProps, type JSX } from 'solid-js';
import type { LinkProps } from './types';
import { useLink } from './use-link';
import { useIsOpened } from './use-is-opened';

/**
 * @description Navigates user to provided route on click
 * @link https://router.effector.dev/solid/link.html
 * @example ```tsx
 * import { Link } from '@effector/router-solid';
 * import { routes } from '@shared/routing';
 *
 * function Profile(props) {
 *   return (
 *     <>
 *       <Link to={routes.settings}>Settings</Link>
 *
 *       <For each={props.user.posts}>
 *         {(post) => (
 *           <Link to={routes.editPost} params={{ id: post.id }}>
 *             Edit post
 *           </Link>
 *         )}
 *       </For>
 *     </>
 *   );
 * }
 * ```
 */
export function Link<Params extends object | void = void>(
  props: LinkProps<Params>,
) {
  const [local, anchorProps] = splitProps(props, [
    'to',
    'params',
    'onClick',
    'replace',
    'query',
    'activeClass',
    'children',
  ]);

  const { path, onOpen } = useLink<Params>(
    local.to as Route<Params>,
    () => local.params as Params,
    () => local.query,
  );
  const isOpened = useIsOpened(local.to as Route<Params>);
  const className = () =>
    [anchorProps.class, isOpened() ? local.activeClass : undefined]
      .filter(Boolean)
      .join(' ');

  const handleClick: JSX.EventHandler<HTMLAnchorElement, MouseEvent> = (
    event,
  ) => {
    callClickHandler(local.onClick, event);

    // allow user to prevent navigation
    if (event.defaultPrevented) {
      return;
    }

    // Preserve native anchor behavior for non-primary clicks, downloads,
    // non-self targets, modified clicks, and cross-origin URLs.
    if (event.button !== 0 || anchorProps.download !== undefined) {
      return;
    }

    if (anchorProps.target && anchorProps.target !== '_self') {
      return;
    }

    // skip modified events (like cmd + click to open the link in new tab)
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
      return;
    }

    const href = new URL(event.currentTarget.href, window.location.href);
    if (href.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();

    onOpen({
      params: local.params || {},
      replace: local.replace,
      query: local.query,
    } as RouteOpenPayload<Params>);
  };

  return (
    <a {...anchorProps} class={className()} href={path()} onClick={handleClick}>
      {local.children}
    </a>
  );
}

// Solid event handlers can be a plain function or a bound `[handler, data]`
// tuple. Support both so consumers can pass either form.
function callClickHandler(
  handler: JSX.EventHandlerUnion<HTMLAnchorElement, MouseEvent> | undefined,
  event: MouseEvent & { currentTarget: HTMLAnchorElement; target: Element },
) {
  if (!handler) {
    return;
  }

  if (typeof handler === 'function') {
    handler(event);
  } else {
    handler[0](handler[1], event);
  }
}
