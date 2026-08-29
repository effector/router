import { describe, expect, test } from 'vitest';
import {
  createResolveRouteViewState,
  resolveRouteView,
  type ResolveRouteViewState,
  type RouteViewFallbackShape,
} from '../lib/resolve-route-view';

interface TestView {
  name: string;
  fallback?: RouteViewFallbackShape<string>;
}

const view = (
  name: string,
  fallback?: RouteViewFallbackShape<string>,
): TestView => ({
  name,
  fallback,
});

const getFallback = (v: TestView) => v.fallback;
const getViewComponent = (v: TestView) => `${v.name}:view`;

function resolve(
  views: TestView[],
  openedView: TestView | undefined,
  pending: boolean[],
  previousState: ResolveRouteViewState<TestView, string>,
  hasOtherwise = false,
) {
  return resolveRouteView({
    views,
    openedView,
    pending,
    getFallback,
    getViewComponent,
    hasOtherwise,
    previousState,
  });
}

describe('resolveRouteView', () => {
  test('an opened view wins over everything else', () => {
    const a = view('a', { closed: 'a:closed' });
    const b = view('b');

    const { resolved } = resolve(
      [a, b],
      a,
      [false, false],
      createResolveRouteViewState(),
    );

    expect(resolved).toEqual({ view: a, component: 'a:view' });
  });

  test('loading of a pending view wins over a closed sibling', () => {
    const a = view('a', { loading: 'a:loading' });
    const b = view('b', { closed: 'b:closed' });

    const { resolved } = resolve(
      [a, b],
      undefined,
      [true, false],
      createResolveRouteViewState(),
    );

    expect(resolved).toEqual({ view: a, component: 'a:loading' });
  });

  test('closed of a closed view, when nothing opened or pending', () => {
    const a = view('a', { closed: 'a:closed' });

    const { resolved } = resolve(
      [a],
      undefined,
      [false],
      createResolveRouteViewState(),
    );

    expect(resolved).toEqual({ view: a, component: 'a:closed' });
  });

  test('null when nothing applies', () => {
    const a = view('a');

    const { resolved } = resolve(
      [a],
      undefined,
      [false],
      createResolveRouteViewState(),
    );

    expect(resolved).toBeNull();
  });

  test('the last declared view with a matching fallback wins over an earlier one', () => {
    const a = view('a', { closed: 'a:closed' });
    const b = view('b', { closed: 'b:closed' });

    const { resolved } = resolve(
      [a, b],
      undefined,
      [false, false],
      createResolveRouteViewState(),
    );

    expect(resolved).toEqual({ view: b, component: 'b:closed' });
  });

  describe('the transition hold', () => {
    test('holds the previously resolved view while any listed route is still pending', () => {
      const a = view('a');
      const b = view('b');

      // a opens, resolving to a and setting `previous`.
      const opened = resolve(
        [a, b],
        a,
        [false, false],
        createResolveRouteViewState(),
      );

      // a closes, b becomes pending with no loading declared: nothing claims
      // the frame outright, but the hold keeps returning a's view.
      const { resolved } = resolve(
        [a, b],
        undefined,
        [false, true],
        opened.state,
      );

      expect(resolved).toEqual({ view: a, component: 'a:view' });
    });

    test('does not hold once nothing is pending: falls through to closed/null', () => {
      const a = view('a');

      const opened = resolve([a], a, [false], createResolveRouteViewState());
      const { resolved } = resolve([a], undefined, [false], opened.state);

      expect(resolved).toBeNull();
    });

    test('does not resurrect a view once it has fallen through to null', () => {
      const a = view('a');
      const b = view('b');

      const opened = resolve(
        [a, b],
        a,
        [false, false],
        createResolveRouteViewState(),
      );

      // a closes with nothing pending: falls through to null, and the
      // resulting state must not keep a around for a later, unrelated
      // pending tick.
      const closed = resolve([a, b], undefined, [false, false], opened.state);

      // Much later, b starts pending — unrelated to a, which the caller
      // already stopped rendering.
      const { resolved } = resolve(
        [a, b],
        undefined,
        [false, true],
        closed.state,
      );

      expect(resolved).toBeNull();
    });
  });

  describe('the otherwise gate', () => {
    test('suppresses an unrelated closed sibling until something has ever matched', () => {
      const a = view('a');
      const b = view('b', { closed: 'b:closed' });

      const { resolved } = resolve(
        [a, b],
        undefined,
        [false, false],
        createResolveRouteViewState(),
        true,
      );

      expect(resolved).toBeNull();
    });

    test('lets closed win once the list has genuinely been active', () => {
      const a = view('a');
      const b = view('b', { closed: 'b:closed' });

      // a opens for real, marking the list active.
      const opened = resolve(
        [a, b],
        a,
        [false, false],
        createResolveRouteViewState(),
        true,
      );

      // a closes again: b's closed fallback is now a legitimate candidate.
      const { resolved } = resolve(
        [a, b],
        undefined,
        [false, false],
        opened.state,
        true,
      );

      expect(resolved).toEqual({ view: b, component: 'b:closed' });
    });

    test('being pending also counts as activity', () => {
      const a = view('a', { closed: 'a:closed' });

      const { resolved } = resolve(
        [a],
        undefined,
        [true],
        createResolveRouteViewState(),
        true,
      );

      expect(resolved).toEqual({ view: a, component: 'a:closed' });
    });

    test('does not apply when the caller has no otherwise of its own', () => {
      const a = view('a');
      const b = view('b', { closed: 'b:closed' });

      const { resolved } = resolve(
        [a, b],
        undefined,
        [false, false],
        createResolveRouteViewState(),
      );

      expect(resolved).toEqual({ view: b, component: 'b:closed' });
    });
  });

  test('does not mutate the state object it was given', () => {
    const a = view('a');
    const state = createResolveRouteViewState<TestView, string>();
    const snapshot = { ...state };

    resolve([a], a, [false], state);

    expect(state).toEqual(snapshot);
  });
});
