---
title: Show skeletons while nested data loads
---

# Show skeletons while nested data loads

A deep page usually loads in layers: the session first, then the list, then the
item. This guide gives every layer its own skeleton, so each part of the screen
appears as soon as its own data is ready and the layers already on screen stay
mounted.

For a cold visit to `/registry/42`:

| Moment                    | On screen                              |
| ------------------------- | -------------------------------------- |
| session check running     | full-page skeleton                     |
| session ready, list loads | app shell + registry skeleton          |
| list ready, item loads    | app shell + registry + item skeleton   |
| item ready                | app shell + registry + inspection page |

The not-found screen never flashes in between.

The guide assumes a router already rendering React views — see
[Build your first router](/tutorials/build-your-first-router) if you don't have
one yet. Every snippet below is one file,
[`docs/how-to/nested-loading-skeletons.tsx`](https://github.com/effector/router/blob/main/docs/how-to/nested-loading-skeletons.tsx),
which runs as a test in the React package suite.

## 1. Declare one route per URL level

Nest routes with `parent`: the paths compose into `/registry/:inspectionId`, and
opening the child opens its parents.

```tsx
import { createRoute, createRouter } from '@effector/router';

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
```

## 2. Load each level with its own effect

One effect per level, fetching only what that level renders. The levels load in
parallel, so a deep link does not pay for a request waterfall.

```tsx
import { createEffect, createStore } from 'effector';

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
```

`loadInspectionFx` is called with the route payload, so the item id comes from
`params` — there is no extra store to keep in sync with the URL.

## 3. Gate every level behind `chainRoute`

[`chainRoute`] derives a route that opens only once its preparation resolves and
reports `$isPending` while it runs. That pending state is what a skeleton hangs
on.

```tsx
import { chainRoute } from '@effector/router';

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
```

## 4. Write a page and a skeleton per level

Parents render an [`Outlet`] where the next level appears. Pages read the data
their level waited for.

```tsx
import { useUnit } from 'effector-react';
import { Outlet } from '@effector/router-react';

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
```

## 5. Nest the views and give each one a `loading`

Bind every view to the **chained** route, nest them with `children` to mirror
the route nesting, and declare what each level shows while its own data loads.

```tsx
import { createRouteView, createRoutesView } from '@effector/router-react';

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
```

Render `RoutesView` inside [`RouterProvider`] as usual. That is the whole
mechanism:

- each `loading` renders while that level's chain is pending, in the slot its
  view would occupy — the top level in the routes view, the deeper ones in
  their parent's `Outlet`;
- an opened view always wins over a fallback, so a level already on screen is
  never replaced by a skeleton when a child reloads;
- the `otherwise` of `createRoutesView` renders only when no view claims the
  slot, which is why the not-found screen no longer flashes mid-navigation.

## Fill the slot when nothing is selected

`/registry` on its own leaves the innermost `Outlet` with nothing to render.
`closed` lets the child view own that slot too:

```tsx
createRouteView({
  route: inspectionReady,
  view: InspectionPage,
  loading: InspectionSkeleton,
  closed: () => <article>Pick an inspection</article>,
});
```

## Split a level into its own chunk

Swap the level for [`createLazyRouteView`] and keep the same `loading` — it
covers the chunk request as well as the pending route, so the skeleton stays put
across both waits:

```tsx
import { createLazyRouteView } from '@effector/router-react';

createLazyRouteView({
  route: inspectionReady,
  view: () => import('./inspection-page'),
  loading: InspectionSkeleton,
});
```

## Keep one layout across a whole section

When several pages share a shell, [`withLayout`] groups them: the layout
instance survives while views from the same group swap, including while one of
them is showing a fallback.

## Related

- [createRouteView](/react/create-route-view#with-fallbacks) — the full fallback
  resolution order
- [chainRoute](/core/chain-route) — preparation, cancellation, and `$isPending`
- [Navigation lifecycle](/explanation/navigation-lifecycle) — where preparation
  sits relative to the URL commit

[`chainRoute`]: /core/chain-route
[`createLazyRouteView`]: /react/create-lazy-route-view
[`Outlet`]: /react/outlet
[`RouterProvider`]: /react/router-provider
[`withLayout`]: /react/with-layout
