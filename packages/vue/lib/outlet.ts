import { defineComponent, h, inject } from 'vue';
import { OutletInjectionKey } from './context';
import { useResolvedRouteView } from './resolve-route-view';
import { RouteRenderer } from './create-routes-view';

/**
 * @description Renders nested child routes of the currently opened route.
 * Place it inside a view whose `RouteView` was created with `children`.
 * @link https://router.effector.dev/vue/outlet.html
 * @example ```ts
 * export const RoutesView = createRoutesView({
 *   routes: [
 *     createRouteView({
 *       route: routes.profile,
 *       view: Profile, // renders <Outlet /> somewhere inside
 *       children: [
 *         createRouteView({ route: routes.settings, view: Settings }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
export const Outlet = defineComponent({
  name: 'Outlet',
  setup() {
    const children = inject(OutletInjectionKey, []);
    const resolved = useResolvedRouteView(children);

    return () => {
      const current = resolved.value;

      if (!current) {
        return null;
      }

      return h(RouteRenderer, {
        routeView: current.view,
        component: current.component,
        key: children.indexOf(current.view),
      });
    };
  },
});
