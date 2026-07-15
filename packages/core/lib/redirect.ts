import { createEvent, sample, type EventCallable } from 'effector';

import type { PathRoute, RouteOpenPayload } from './types';
import { navigationKind } from './navigation';

export interface RedirectConfig<T extends object | void = void> {
  to: PathRoute<T>;
  replace?: boolean;
}

/** Creates a clock-less navigation target for use in `sample`. */
export function redirect<T extends object | void = void>(
  config: RedirectConfig<T>,
): EventCallable<RouteOpenPayload<T>> {
  const redirected = createEvent<RouteOpenPayload<T>>();

  sample({
    clock: redirected,
    fn: (payload) => {
      const result: Record<PropertyKey, unknown> = {
        ...(payload ?? {}),
        [navigationKind]: 'redirect' as const,
      };

      if (config.replace !== undefined) result.replace = config.replace;

      return result as unknown as RouteOpenPayload<T>;
    },
    target: config.to.open,
  });

  return redirected;
}
