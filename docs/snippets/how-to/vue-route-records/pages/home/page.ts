import { defineComponent, h } from 'vue';
import { Link } from '@effector/router-vue';
import { routes } from '../../shared/routing';

export const HomePage = defineComponent({
  name: 'HomePage',
  setup: () => () =>
    h('main', [
      h('h1', 'Home'),
      h(Link, { to: routes.post, params: { id: '1' } }, () => 'First post'),
    ]),
});
