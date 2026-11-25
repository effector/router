import { defineAsyncComponent, defineComponent, h, type Component } from 'vue';
import type { CreateLazyRouteViewProps, LazyRouteView } from './types';

type LazyModule = { default: Component };

/**
 * @description Creates Lazy route view with async bundle load
 * @link https://router.effector.dev/vue/create-lazy-route-view.html
 * @param props Lazy route view props
 * @returns RouteView with `preload()`
 * @example ```ts
 * import { createLazyRouteView } from '@effector/router-vue';
 * import { routes } from '@shared/routing';
 * import { MainLayout } from '@layouts';
 * import Fallback from './fallback.vue';
 *
 * export const ProfileScreen = createLazyRouteView({
 *   route: routes.profile,
 *   view: () => import('./profile.vue'),
 *   fallback: Fallback,
 *   layout: MainLayout,
 * });
 * ```
 */
export function createLazyRouteView<T extends object | void = void>(
  props: CreateLazyRouteViewProps<T>,
): LazyRouteView {
  const {
    route,
    view,
    layout,
    fallback,
    children,
    error,
    onError,
    timeout,
    delay = 0,
    // Vue's own default is `true`. Under any ancestor `<Suspense>` it replaces
    // `fallback` of this view by the fallback of that Suspense.
    // Test: "shows fallback under an ancestor Suspense".
    suspensible = false,
    hydrate,
    name,
  } = props;

  // One request for `preload()` and for the render. A failed request is
  // dropped, so the next call loads again.
  // Tests: "preload loads the chunk once", "a failed preload does not break
  // later loads".
  let request: Promise<LazyModule> | undefined;
  // The loaded page. Vue keeps its own copy inside the async wrapper and sets
  // it only after the wrapper mounted, so `preload()` cannot reach it.
  let loaded: Component | undefined;

  const load = () => {
    // The loader is called inside a promise, so a loader that throws rejects
    // the request, as a loader that returns a rejected promise does.
    // Test: "preload rejects when the loader throws".
    request ??= new Promise<LazyModule>((resolve) => resolve(view())).then(
      (module) => {
        loaded = unwrapModule(module);

        return module;
      },
      (reason) => {
        request = undefined;

        throw reason;
      },
    );

    return request;
  };

  const AsyncView = defineAsyncComponent({
    loader: load,
    loadingComponent: fallback,
    errorComponent: error,
    onError,
    timeout,
    delay,
    suspensible,
    hydrate,
  });

  const wrapped = defineComponent({
    // The name is known before the chunk loads, so `KeepAlive include` can
    // match the view. Test: "KeepAlive include matches a lazy view by name
    // before the chunk loads".
    name: name ?? (layout ? 'LazyRouteViewWithLayout' : 'LazyRouteView'),
    setup() {
      // Chosen once, in setup. After `preload()` the page renders at once: the
      // async wrapper would mount `fallback` for one render even then.
      // Test: "a view mounted after preload never mounts the fallback".
      const Page = loaded ?? AsyncView;

      return () =>
        layout ? h(layout, null, { default: () => h(Page) }) : h(Page);
    },
  });

  return {
    route,
    view: wrapped,
    children,
    preload: () => load().then(() => {}),
  };
}

// The rule of `defineAsyncComponent`: the page is `default` of an ES module,
// any other loader result is the page itself.
function unwrapModule(module: LazyModule): Component {
  const interop = module as LazyModule & {
    __esModule?: boolean;
    [Symbol.toStringTag]?: string;
  };

  return interop.__esModule || interop[Symbol.toStringTag] === 'Module'
    ? module.default
    : module;
}
