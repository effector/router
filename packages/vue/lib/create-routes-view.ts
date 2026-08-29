import {
  defineComponent,
  h,
  provide,
  type Component,
  type PropType,
} from 'vue';
import { OutletInjectionKey } from './context';
import { useResolvedRouteView } from './resolve-route-view';
import { layoutGroup, type RouteView } from './types';

/**
 * @internal Renders a single resolved view and exposes its nested children to
 * `<Outlet />` through provide/inject. Grouped views keep a stable group key
 * while their page child changes. `component` is the view itself or one of its
 * `loading` / `otherwise` fallbacks.
 */
export const RouteRenderer = defineComponent({
  name: 'RouteRenderer',
  props: {
    routeView: { type: Object as PropType<RouteView>, required: true },
    component: {
      type: [Object, Function] as PropType<Component>,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    provide(OutletInjectionKey, props.routeView.children ?? []);

    return () => {
      const group = props.routeView[layoutGroup];
      const content = h(props.component ?? props.routeView.view);

      return group
        ? h(group.layout, null, { default: () => content })
        : content;
    };
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
      const resolved = useResolvedRouteView(routes, {
        hasOtherwise: !!otherwise,
      });

      return () => {
        const current = resolved.value;

        if (!current) {
          return otherwise ? h(otherwise) : null;
        }

        const group = current.view[layoutGroup];

        return h(RouteRenderer, {
          routeView: current.view,
          component: current.component,
          key: group?.token ?? routes.indexOf(current.view),
        });
      };
    },
  });
};
