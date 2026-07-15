import { describe, expect, test } from 'vitest';
import {
  createRoute,
  createRouter,
  createRouterControls,
  trackQuery,
} from '../lib';
import { z } from 'zod/v4';

describe('core public surface', () => {
  test('exposes standalone query tracking and no removed tracker methods', () => {
    const controls = createRouterControls();
    const router = createRouter({
      routes: [createRoute({ path: '/' })],
      controls,
    });

    expect(typeof trackQuery).toBe('function');
    expect('trackQuery' in controls).toBe(false);
    expect('trackQuery' in router).toBe(false);
    expect(
      trackQuery({ controls, parameters: z.object({ q: z.string() }) }),
    ).toMatchObject({ enter: expect.anything(), exit: expect.anything() });
  });
});
