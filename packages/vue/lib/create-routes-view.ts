import {
  defineComponent,
  h,
  provide,
  type Component,
  type PropType,
} from 'vue';
import { OutletInjectionKey } from './context';
import { useOpenedViews } from './use-opened-views';
import type { RouteView } from './types';

/**
 * @internal Renders a single resolved view and exposes its nested children to
 * `<Outlet />` through provide/inject. Remounted (via `key`) whenever the
 * opened view changes, so provided children stay fresh.
 */
export const RouteRenderer = defineComponent({
  name: 'RouteRenderer',
  props: {
    routeView: { type: Object as PropType<RouteView>, required: true },
  },
  setup(props) {
    provide(OutletInjectionKey, props.routeView.children ?? []);

    return () => h(props.routeView.view);
  },
});

interface CreateRoutesViewProps {
  routes: RouteView[];
  otherwise?: Component;
}

/**
 * @description Create routes view which renders the currently opened route.
 * Don't forget to wrap it with `<RouterProvider>`!
 * @param props Routes view config
 * @link https://router.effector.dev/vue/create-routes-view.html
 * @returns RoutesView component
 * @example ```ts
 * import { createRoutesView } from '@effector/router-vue';
 * import { FeedScreen, ProfileScreen } from './screens';
 *
 * const RoutesView = createRoutesView({ routes: [FeedScreen, ProfileScreen] });
 * ```
 */
export const createRoutesView = (props: CreateRoutesViewProps) => {
  const { routes, otherwise } = props;

  return defineComponent({
    name: 'RoutesView',
    setup() {
      const openedViews = useOpenedViews(routes);

      return () => {
        const view = openedViews.value.at(-1);

        if (!view) {
          return otherwise ? h(otherwise) : null;
        }

        return h(RouteRenderer, {
          routeView: view,
          key: routes.indexOf(view),
        });
      };
    },
  });
};
