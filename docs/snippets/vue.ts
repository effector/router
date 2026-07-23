import { createRoute } from '@effector/router';
import { useLink } from '@effector/router-vue';

const home = createRoute({ path: '/home' });

export function vueQuickStart() {
  const link = useLink(home);
  return link.build();
}
