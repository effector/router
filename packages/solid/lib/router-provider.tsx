import type { JSX } from 'solid-js';
import type { Router } from '@effector/router';
import { RouterProviderContext } from './context';

interface RouterProviderProps {
  children?: JSX.Element;
  router: Router;
}

/**
 * @description Provides router in Solid tree
 * @param props Router provider config
 */
export function RouterProvider(props: RouterProviderProps) {
  return (
    <RouterProviderContext.Provider value={props.router}>
      {props.children}
    </RouterProviderContext.Provider>
  );
}
