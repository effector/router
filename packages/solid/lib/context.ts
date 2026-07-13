import type { Router } from '@effector/router';
import { createContext } from 'solid-js';
import type { RouteView } from './types';

export const RouterProviderContext = createContext<Router | null>(null);
export const OutletContext = createContext<{ children: RouteView[] }>({
  children: [],
});
