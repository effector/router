/// <reference types="vite/client" />
import { createRoutesView, type RouteView } from '@effector/router-vue';

// Every `pages/<name>/index.route-record.ts`, loaded with the application.
const records = import.meta.glob<RouteView>(
  '../pages/*/index.route-record.ts',
  { eager: true, import: 'default' },
);

export const RoutesView = createRoutesView({ routes: Object.values(records) });
