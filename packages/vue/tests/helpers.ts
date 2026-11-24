import type { Scope } from 'effector';
import type { Router } from '@effector/router';
import { mount, type MountingOptions } from '@vue/test-utils';
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
