import { defineComponent, inject } from 'vue';
import { OutletInjectionKey } from './context';
import { useOpenedViews } from './use-opened-views';
import { renderView } from './create-routes-view';

// `@__PURE__`: see router-provider.ts.
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
export const Outlet = /* @__PURE__ */ defineComponent({
  name: 'Outlet',
  setup() {
    const children = inject(OutletInjectionKey, []);
    const openedViews = useOpenedViews(children);

    return () => {
      const view = openedViews.value.at(-1);

      return view ? renderView(view) : null;
    };
  },
});
