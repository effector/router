import { act, render } from '@testing-library/react';
import { allSettled, fork } from 'effector';
import { Provider } from 'effector-react';
import { createMemoryHistory } from 'history';
import { historyAdapter } from '@effector/router';
import { expect, test } from 'vitest';
import {
  checkSessionFx,
  inspectionRoute,
  loadInspectionFx,
  loadRegistryFx,
  registryRoute,
  RoutesView,
  router,
  type Inspection,
  type RegistryEntry,
  type Session,
} from '../../../docs/how-to/nested-loading-skeletons';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });

  return { promise, resolve };
}

// Lets the pending effects settle their microtasks and React flush the commit
// they caused, without waiting for the whole navigation to finish.
function settle() {
  return act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function setup() {
  const session = deferred<Session>();
  const registry = deferred<RegistryEntry[]>();
  const inspection = deferred<Inspection>();
  const scope = fork({
    handlers: [
      [checkSessionFx, () => session.promise],
      [loadRegistryFx, () => registry.promise],
      [loadInspectionFx, () => inspection.promise],
    ],
  });
  // Start away from every route, so the app boots idle and the guide's
  // navigation is the only thing that triggers the chains.
  const history = createMemoryHistory({ initialEntries: ['/boot'] });

  await allSettled(router.setHistory, {
    scope,
    params: historyAdapter(history),
  });

  return { scope, history, session, registry, inspection };
}

test('how-to: nested loading reveals one level at a time', async () => {
  const { scope, history, session, registry, inspection } = await setup();
  const { queryByText } = render(
    <Provider value={scope}>
      <RoutesView />
    </Provider>,
  );

  expect(queryByText('Not found')).toBeTruthy();

  const navigation = allSettled(inspectionRoute.open, {
    scope,
    params: { params: { inspectionId: '42' } },
  });

  // The session check is still running: the whole page is a skeleton, and the
  // routes view `otherwise` no longer shows through.
  await settle();
  expect(queryByText('Signing in…')).toBeTruthy();
  expect(queryByText('Not found')).toBeNull();

  // The shell is on screen and stays mounted while the registry loads.
  session.resolve({ userName: 'edward' });
  await settle();
  expect(queryByText('Signed in as edward')).toBeTruthy();
  expect(queryByText('Loading registry…')).toBeTruthy();

  // The registry page keeps its chrome while the inspection loads.
  registry.resolve([{ id: '42', title: 'Bridge deck' }]);
  await settle();
  expect(queryByText('Signed in as edward')).toBeTruthy();
  expect(queryByText('Registry')).toBeTruthy();
  expect(queryByText('Loading inspection…')).toBeTruthy();

  inspection.resolve({ id: '42', title: 'Deck joints', status: 'open' });
  await act(() => navigation);

  expect(queryByText('Signed in as edward')).toBeTruthy();
  expect(queryByText('Registry')).toBeTruthy();
  expect(queryByText('Deck joints')).toBeTruthy();
  expect(queryByText('Status: open')).toBeTruthy();
  expect(queryByText('Loading inspection…')).toBeNull();
  expect(scope.getState(inspectionRoute.$params)).toStrictEqual({
    inspectionId: '42',
  });
  expect(history.location.pathname).toBe('/registry/42');
});

test('how-to: the inner outlet shows its closed placeholder', async () => {
  const { scope, session, registry } = await setup();
  const { queryByText } = render(
    <Provider value={scope}>
      <RoutesView />
    </Provider>,
  );

  const navigation = allSettled(registryRoute.open, {
    scope,
    params: undefined,
  });

  session.resolve({ userName: 'edward' });
  registry.resolve([{ id: '42', title: 'Bridge deck' }]);
  await act(() => navigation);

  expect(queryByText('Registry')).toBeTruthy();
  expect(queryByText('Bridge deck')).toBeTruthy();
  expect(queryByText('Pick an inspection')).toBeTruthy();
  expect(queryByText('Loading inspection…')).toBeNull();
});
