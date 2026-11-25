import { defineComponent, getCurrentInstance, inject, watch } from 'vue';
import { LayoutPageInjectionKey } from './context';
import {
  renderPage,
  renderViewSlot,
  routeViewSlots,
} from './create-routes-view';

// `@__PURE__`: see router-provider.ts.
/**
 * @description Renders the page of a `withLayout` group. Place it in the
 * layout of the group in place of the default slot. Its scoped slot
 * `{ Component, view }` lets the layout wrap the page in `KeepAlive` or
 * `Transition`. A navigation by path between two pages of the group mounts
 * the layout again, and the pages cached inside it are lost: see "When the
 * layout remounts" on the page below.
 * @link https://router.effector.dev/vue/layout-outlet.html
 * @example ```ts
 * // AuthLayout.vue:
 * // <LayoutOutlet v-slot="{ Component }">
 * //   <KeepAlive><component :is="Component" /></KeepAlive>
 * // </LayoutOutlet>
 * export const RoutesView = createRoutesView({
 *   routes: withLayout(AuthLayout, [
 *     createRouteView({ route: routes.signIn, view: SignIn }),
 *     createRouteView({ route: routes.signUp, view: SignUp }),
 *   ]),
 * });
 * ```
 */
export const LayoutOutlet = /* @__PURE__ */ defineComponent({
  name: 'LayoutOutlet',
  slots: routeViewSlots,
  setup(_, { slots }) {
    const page = inject(LayoutPageInjectionKey, null);

    if (!page) {
      // Test: "LayoutOutlet outside a withLayout layout renders nothing and
      // reports it".
      console.error(
        '[@effector/router-vue] <LayoutOutlet /> renders nothing outside a layout passed to withLayout',
      );
    }

    // Vue-specific: this component renders again at the moment the page of
    // the group changes, not in a later queued job. `KeepAlive` around the
    // group gives its host the new page while it activates the host, and
    // queues the `onActivated` hooks of the old page right after. A queued
    // render would leave the old page in place for those hooks.
    // `flush: 'sync'` runs the callback inside the change, and
    // `instance.update()` is the render job of this component.
    // Tests: "a kept-alive layout activates only the page it shows", "a page
    // under a kept-alive layout is activated after it mounts".
    const instance = getCurrentInstance()!;

    if (page) watch(page, () => instance.update(), { flush: 'sync' });

    return () => {
      const view = page ? page() : null;

      return renderViewSlot(
        slots.default,
        view ? renderPage(view) : null,
        view,
      );
    };
  },
});
