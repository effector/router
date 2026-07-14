import type { Route, RouteOpenedPayload } from '@effector/router';
import { splitProps, type JSX } from 'solid-js';
import type { LinkProps } from './types';
import { useLink } from './use-link';

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
    'children',
  ]);

  const { path, onOpen } = useLink<Params>(
    local.to as Route<Params>,
    () => local.params as Params,
  );

  const handleClick: JSX.EventHandler<HTMLAnchorElement, MouseEvent> = (
    event,
  ) => {
    callClickHandler(local.onClick, event);

    // allow user to prevent navigation
    if (event.defaultPrevented) {
      return;
    }

    // let browser handle "_blank" target and etc
    if (anchorProps.target && anchorProps.target !== '_self') {
      return;
    }

    // skip modified events (like cmd + click to open the link in new tab)
    if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
      return;
    }

    event.preventDefault();

    onOpen({
      params: local.params || {},
      replace: local.replace,
      query: local.query,
    } as RouteOpenedPayload<Params>);
  };

  return (
    <a {...anchorProps} href={path()} onClick={handleClick}>
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
