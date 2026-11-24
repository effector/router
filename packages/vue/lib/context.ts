import type { InjectionKey } from 'vue';
import type { Router } from '@effector/router';
import type { RouteView } from './types';

// `Symbol.for` gives one symbol per string for the whole runtime. The package
// ships an ESM and a CJS build. When an application loads both copies, a
// provider from one copy and `inject` from the other still use one key. A
// plain `Symbol()` would be a new key in each copy.
// Test: "a provider and a consumer from two copies of the package meet".
export const RouterInjectionKey: InjectionKey<Router> = Symbol.for(
  '@effector/router-vue:router',
);

// The number is the version of the provided value, `RouteView[]`. Change it
// together with that shape, so that two copies of different versions do not
// read the value of each other.
// Test: "a view host from one copy and an Outlet from the other meet".
export const OutletInjectionKey: InjectionKey<RouteView[]> = Symbol.for(
  '@effector/router-vue:outlet:1',
);

// The page of the nearest `withLayout` group, for `<LayoutOutlet />`. A
// getter, so that the reader tracks the page as the group switches it.
// `null` marks a place outside a layout. The number is the version, as above.
// Test: "a layout of one copy and a LayoutOutlet from the other meet".
export const LayoutPageInjectionKey: InjectionKey<(() => RouteView) | null> =
  Symbol.for('@effector/router-vue:layout-page:1');
