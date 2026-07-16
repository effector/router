import type { RouteOpenedPayload } from '@effector/router';
import { type ForwardedRef, forwardRef, type ReactNode } from 'react';
import type { LinkProps } from './types';
import { useLink } from './use-link';

type ForwardedLink = <Params extends object | void = void>(
  props: LinkProps<Params> & { ref?: ForwardedRef<HTMLAnchorElement> },
) => ReactNode;

/**
 * @description Navigates user to provided route on click
 * @link https://router.effector.dev/react/link.html
 * @example ```tsx
 * import { Link } from '@effector/router-react';
 * import { routes } from '@shared/routing';
 *
 * function Profile({ user }) {
 *   return (
 *     <>
 *       <Link to={routes.settings}>Settings</Link>
 *
 *       {user.posts.map((post) => (
 *         <Link to={routes.editPost} params={{ id: post.id }}>
 *           Edit post
 *         </Link>
 *       ))}
 *     </>
 *   );
 * }
 * ```
 */
export const Link: ForwardedLink = forwardRef<
  HTMLAnchorElement,
  LinkProps<any>
>((props, ref) => {
  const { to, params, onClick, replace, query, ...anchorProps } = props;

  const { path, onOpen } = useLink(to, params, query);

  return (
    <a
      {...anchorProps}
      ref={ref}
      href={path}
      onClick={(e) => {
        onClick?.(e);

        // allow user to prevent navigation
        if (e.defaultPrevented) {
          return;
        }

        // Preserve native anchor behavior for non-primary clicks, downloads,
        // non-self targets, modified clicks, and cross-origin URLs.
        if (e.button !== 0 || anchorProps.download !== undefined) {
          return;
        }

        if (anchorProps.target && anchorProps.target !== '_self') {
          return;
        }

        // skip modified events (like cmd + click to open the link in new tab)
        if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
          return;
        }

        const href = new URL(e.currentTarget.href, window.location.href);
        if (href.origin !== window.location.origin) {
          return;
        }

        e.preventDefault();

        onOpen({
          params: params || {},
          replace,
          query,
        } as RouteOpenedPayload<any>);
      }}
    />
  );
});
