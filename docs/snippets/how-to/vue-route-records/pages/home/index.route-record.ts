import type { RouteView } from '@effector/router-vue';
import { routes } from '../../shared/routing';
import { HomePage } from './page';

export default { route: routes.home, view: HomePage } satisfies RouteView;
