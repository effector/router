import type { RouteView } from '@effector/router-vue';
import { routes } from '../../shared/routing';
import { PostPage } from './page';

// The view is bound to the path route, so the page mounts at once and shows
// its skeleton until the chained route opens.
export default { route: routes.post, view: PostPage } satisfies RouteView;
