// Executable source for docs/how-to/nested-loading-skeletons.md, run by
// packages/react/tests/how-to-nested-loading.test.tsx. Imports are repo-relative
// so the test suite can load this file directly; in an application they are the
// published package names, exactly as the guide shows them.
import { createEffect, createStore } from 'effector';
import { useUnit } from 'effector-react';
import {
  chainRoute,
  createRoute,
  createRouter,
} from '../../packages/core/lib/index';
import {
  createRouteView,
  createRoutesView,
  Outlet,
} from '../../packages/react/lib/index';

export interface Session {
  userName: string;
}

export interface RegistryEntry {
  id: string;
  title: string;
}

export interface Inspection {
  id: string;
  title: string;
  status: string;
}

// 1. One route per URL level.
export const appRoute = createRoute({ path: '/' });
export const registryRoute = createRoute({
  path: '/registry',
  parent: appRoute,
});
export const inspectionRoute = createRoute({
  path: '/:inspectionId',
  parent: registryRoute,
});

export const router = createRouter({
  routes: [appRoute, registryRoute, inspectionRoute],
});

// 2. One effect per level, loading only what that level renders.
export const checkSessionFx = createEffect<void, Session>(async () => {
  const response = await fetch('/api/session');
  return response.json();
});

export const loadRegistryFx = createEffect<void, RegistryEntry[]>(async () => {
  const response = await fetch('/api/registry');
  return response.json();
});

export const loadInspectionFx = createEffect(
  async ({ params }: { params: { inspectionId: string } }) => {
    const response = await fetch(`/api/inspections/${params.inspectionId}`);
    return response.json() as Promise<Inspection>;
  },
);

export const $session = createStore<Session | null>(null).on(
  checkSessionFx.doneData,
  (_, session) => session,
);

export const $registry = createStore<RegistryEntry[]>([]).on(
  loadRegistryFx.doneData,
  (_, entries) => entries,
);

export const $inspection = createStore<Inspection | null>(null).on(
  loadInspectionFx.doneData,
  (_, inspection) => inspection,
);

// 3. One chained route per level: opened only after its data has arrived.
export const authenticated = chainRoute({
  route: appRoute,
  beforeOpen: checkSessionFx,
});

export const registryReady = chainRoute({
  route: registryRoute,
  beforeOpen: loadRegistryFx,
});

export const inspectionReady = chainRoute({
  route: inspectionRoute,
  beforeOpen: loadInspectionFx,
});

// 4. A page and a skeleton per level. Parents render an Outlet where the next
// level appears.
function AppShell() {
  const session = useUnit($session);

  return (
    <div>
      <header>Signed in as {session?.userName}</header>
      <Outlet />
    </div>
  );
}

function AppShellSkeleton() {
  return <div>Signing in…</div>;
}

function RegistryPage() {
  const entries = useUnit($registry);

  return (
    <section>
      <h1>Registry</h1>
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>{entry.title}</li>
        ))}
      </ul>
      <Outlet />
    </section>
  );
}

function RegistrySkeleton() {
  return <section>Loading registry…</section>;
}

function InspectionPage() {
  const inspection = useUnit($inspection);

  if (!inspection) return null;

  return (
    <article>
      <h2>{inspection.title}</h2>
      <p>Status: {inspection.status}</p>
    </article>
  );
}

function InspectionSkeleton() {
  return <article>Loading inspection…</article>;
}

function InspectionPlaceholder() {
  return <article>Pick an inspection</article>;
}

function NotFound() {
  return <p>Not found</p>;
}

// 5. Nest the views the same way the routes nest. Every level declares what it
// shows while its own data is loading.
export const RoutesView = createRoutesView({
  routes: [
    createRouteView({
      route: authenticated,
      view: AppShell,
      loading: AppShellSkeleton,
      children: [
        createRouteView({
          route: registryReady,
          view: RegistryPage,
          loading: RegistrySkeleton,
          children: [
            createRouteView({
              route: inspectionReady,
              view: InspectionPage,
              loading: InspectionSkeleton,
              closed: InspectionPlaceholder,
            }),
          ],
        }),
      ],
    }),
  ],
  otherwise: NotFound,
});
