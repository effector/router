import type { Scope } from 'effector';
import type { Router } from '@effector/router';
import { mount, type MountingOptions, type VueWrapper } from '@vue/test-utils';
import { h, type Component } from 'vue';
import { EffectorScopePlugin } from 'effector-vue/composition';
import { RouterProvider } from '../lib';

/**
 * Mounts a component inside `RouterProvider` with the scope plugin.
 * Copy of the local helper of `index.test.ts`.
 */
export function mountRoutes(
  router: Router,
  scope: Scope,
  view: Component,
  global: MountingOptions<unknown>['global'] = {},
) {
  return mount(RouterProvider, {
    props: { router },
    slots: { default: () => h(view) },
    global: {
      ...global,
      plugins: [EffectorScopePlugin({ scope })],
    },
  });
}

interface TestIdQueries {
  getByTestId: (id: string) => Element;
  queryByTestId: (id: string) => Element | null;
}

/**
 * The queries of `@testing-library`, which the React suites use, for a
 * wrapper of `@vue/test-utils`. `getByTestId` throws when nothing is found.
 */
export function testIdQueries(wrapper: VueWrapper): TestIdQueries {
  const selector = (id: string) => `[data-testid="${id}"]`;

  return {
    getByTestId: (id) => wrapper.get(selector(id)).element,
    queryByTestId: (id) => {
      const found = wrapper.find(selector(id));

      return found.exists() ? found.element : null;
    },
  };
}
