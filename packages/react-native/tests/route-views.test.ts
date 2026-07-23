import { createRoute } from '@effector/router';
import type { RouteView } from '@effector/router-react';
import { describe, expect, test } from 'vitest';
import { flattenRouteViews } from '../lib/route-views';

describe('React Native route views', () => {
  test('includes nested route views in navigator screens (#73)', () => {
    const parentRoute = createRoute({ path: '/parent' });
    const childRoute = createRoute({ path: '/child', parent: parentRoute });
    const child: RouteView = { route: childRoute, view: () => null };
    const parent: RouteView = {
      route: parentRoute,
      view: () => null,
      children: [child],
    };

    expect(flattenRouteViews([parent])).toEqual([parent, child]);
  });
});
