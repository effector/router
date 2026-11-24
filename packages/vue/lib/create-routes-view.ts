import {
  defineComponent,
  h,
  provide,
  type Component,
  type PropType,
  type SlotsType,
  type VNode,
} from 'vue';
import { LayoutPageInjectionKey, OutletInjectionKey } from './context';
import { useOpenedViews } from './use-opened-views';
import {
  layoutGroup,
  type LayoutGroup,
  type RouteView,
  type RouteViewSlotProps,
} from './types';

// A page or layout component may be a function or an options object. The name
// is read the way Vue reads it, with `||` because an arrow function has ''.
// `__name` is what a `<script setup>` SFC has in place of `name`.
// Tests: "KeepAlive in a layout matches a page by its __name", "KeepAlive in
// a layout matches a page by its displayName".
const nameOf = (component: any): string | undefined =>
  typeof component === 'function'
    ? component.displayName || component.name
    : component.name || component.__name;

const viewHosts = new WeakMap<RouteView, Component>();
const groupHosts = new WeakMap<LayoutGroup, Component>();

/**
 * @internal The host of one view: it provides the children of this view to
 * `<Outlet />` and renders the page. Each view has its own host component, so
 * Vue never patches one view into another and a view switch always remounts
 * the page. The React binding does the same with a provider per view.
 * The host takes the name of the page for `KeepAlive include`.
 * Tests: "grouped siblings that share one page component get their own
 * children", "KeepAlive in a layout matches a page by its name".
 */
function viewHost(view: RouteView): Component {
  let host = viewHosts.get(view);

  if (!host) {
    host = defineComponent({
      name: nameOf(view.view) || 'RouteView',
      setup() {
        provide(OutletInjectionKey, view.children ?? []);
        // The layout of a group is above this page. Without this line a
        // `<LayoutOutlet />` inside the page would find that layout and
        // render the page inside itself without end.
        // Test: "a LayoutOutlet inside a page does not render the page again".
        provide(LayoutPageInjectionKey, null);

        return () => h(view.view);
      },
    });
    viewHosts.set(view, host);
  }

  return host;
}

/**
 * @internal The host of one `withLayout` group. Its views share this
 * component, so the layout stays mounted while the page inside it changes.
 * The host takes the name of the layout: the slot of `RoutesView` hands out
 * this host for a grouped view, and `KeepAlive include` matches it by name.
 * Tests: "a group layout under Outlet stays mounted while its pages switch",
 * "KeepAlive include matches a group host by the name of its layout".
 */
function groupHost(group: LayoutGroup): Component {
  let host = groupHosts.get(group);

  if (!host) {
    host = defineComponent({
      name: nameOf(group.layout) || 'RouteLayout',
      props: {
        routeView: { type: Object as PropType<RouteView>, required: true },
      },
      setup(props) {
        // Without its own context an `<Outlet />` in the layout reads the list
        // this group is part of and renders the group inside itself.
        // Test: "an Outlet in a group layout under an Outlet does not recurse".
        provide(OutletInjectionKey, []);
        // `<LayoutOutlet />` calls the getter in its own render, so it follows
        // the page of the group.
        // Test: "LayoutOutlet renders the page of its group".
        provide(LayoutPageInjectionKey, () => props.routeView);

        return () =>
          h(group.layout, null, {
            default: () => renderPage(props.routeView),
          });
      },
    });
    groupHosts.set(group, host);
  }

  return host;
}

/** @internal Renders a page without the layout of its group. */
export function renderPage(view: RouteView) {
  return h(viewHost(view));
}

/**
 * @internal Renders a resolved view for `RoutesView` and `<Outlet />`. No
 * `key` is needed: the component type differs for every view and every group.
 */
export function renderView(view: RouteView) {
  const group = view[layoutGroup];

  return group ? h(groupHost(group), { routeView: view }) : renderPage(view);
}

/**
 * @internal The `slots` option of `RoutesView`, `<Outlet />` and
 * `<LayoutOutlet />`. Vue reads it only as a type: it declares the default
 * slot and its props for templates and TSX. The function form keeps the slot
 * argument required.
 * Tests: "RoutesView and Outlet declare the default slot", "LayoutOutlet
 * declares the default slot".
 */
export const routeViewSlots = Object as SlotsType<{
  default?: (props: RouteViewSlotProps) => VNode[];
}>;

/**
 * @internal Hands the view to the default slot, or returns it when there is
 * no slot. A slot that yields one vnode gives that vnode as the root, the way
 * `RouterView` of vue-router does: a render function that returns an array
 * gets a fragment root, and attributes passed to the component are dropped.
 * Test: "a slot with one root keeps the attributes of RoutesView".
 */
export function renderViewSlot(
  slot: ((props: RouteViewSlotProps) => VNode[]) | undefined,
  Component: VNode | null,
  view: RouteView | null,
) {
  if (!slot) return Component;

  const nodes = slot({ Component, view });

  return nodes.length === 1 ? nodes[0] : nodes;
}

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
    slots: routeViewSlots,
    setup(_, { slots }) {
      const openedViews = useOpenedViews(routes);

      return () => {
        const view = openedViews.value.at(-1) ?? null;
        const Component = view
          ? renderView(view)
          : otherwise
            ? h(otherwise)
            : null;

        return renderViewSlot(slots.default, Component, view);
      };
    },
  });
};
