import { For, Show, createEffect, createSignal, type JSX } from 'solid-js';
import { useUnit } from 'effector-solid';
import {
  createLazyRouteView,
  createRouteView,
  createRoutesView,
  Link,
  Outlet,
  RouterProvider,
  useIsOpened,
  useLink,
  useOpenedViews,
  useRouter,
  useRouterContext,
  withLayout,
} from '@effector/router-solid';
import { z } from 'zod';
import { trackQuery } from '@effector/router';
import {
  $authorized,
  authChanged,
  controls,
  drawerRoute,
  helpRoute,
  homeRoute,
  modalRouter,
  modalTaskRoute,
  projectGroup,
  projectOverviewRoute,
  projectTaskRoute,
  projectsRoute,
  protectedVisibleRoute,
  reportsRoute,
  router,
  searchRoute,
  settingsGeneralRoute,
  settingsProfileRoute,
  settingsRouter,
} from './routing/routes';

const projects: Record<string, { name: string; owner: string }> = {
  router: { name: 'Effector Router', owner: 'Core team' },
  solid: { name: 'Solid bindings', owner: 'UI team' },
};

const taskNames: Record<string, string> = {
  'integration-tests': 'Integration tests',
  'route-contracts': 'Route contracts',
};

const searchTracker = trackQuery({
  controls,
  routes: [searchRoute],
  parameters: z.object({ q: z.string().min(1) }),
});

function MainLayout(props: { children: JSX.Element }) {
  return (
    <div class="shell">
      <header class="topbar">
        <Link class="brand" to={homeRoute}>
          Router Lab
        </Link>
        <nav aria-label="Primary navigation" class="topnav">
          <Link to={homeRoute}>Overview</Link>
          <Link to={searchRoute} query={{ q: 'solid' }}>
            Search
          </Link>
          <Link to={reportsRoute}>Reports</Link>
          <Link to={settingsGeneralRoute}>Settings</Link>
        </nav>
      </header>
      <main class="content">{props.children}</main>
    </div>
  );
}

function HomePage() {
  const openDrawer = useUnit(drawerRoute.open);

  return (
    <section data-testid="page-home">
      <span class="eyebrow">Workspace</span>
      <h1>Project overview</h1>
      <p class="lede">A Solid consumer app for exercising router bindings.</p>
      <div class="project-grid">
        <For each={Object.entries(projects)}>
          {([id, project]) => (
            <article class="project-card">
              <span class="card-label">Project</span>
              <h2>{project.name}</h2>
              <p>{project.owner}</p>
              <Link
                data-testid={`project-${id}`}
                to={projectOverviewRoute}
                params={{ projectId: id } as any}
              >
                Open project
              </Link>
            </article>
          )}
        </For>
      </div>
      <div class="action-row">
        <Link data-testid="link-help" to={helpRoute}>
          Help route
        </Link>
        <button
          data-testid="open-drawer"
          type="button"
          onClick={() => openDrawer({ params: { panel: 'activity' } })}
        >
          Open activity panel
        </button>
      </div>
    </section>
  );
}

function ProjectPage() {
  const params = useUnit(projectsRoute.$params);
  const active = useIsOpened(projectGroup as any);
  const project = () =>
    projects[params().projectId] ?? {
      name: 'Unknown project',
      owner: 'Unknown',
    };

  return (
    <section data-testid="page-project">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Project</span>
          <h1>{project().name}</h1>
        </div>
        <span data-testid="project-group-state" class="status-chip">
          {active() ? 'active' : 'closed'}
        </span>
      </div>
      <p>{project().owner}</p>
      <div class="tabs">
        <Link
          to={projectOverviewRoute}
          params={{ projectId: params().projectId } as any}
        >
          Overview
        </Link>
        <Link
          to={projectTaskRoute}
          params={
            {
              projectId: params().projectId,
              taskId: 'integration-tests',
            } as any
          }
        >
          Tasks
        </Link>
      </div>
      <div data-testid="project-outlet" class="outlet">
        <Outlet />
      </div>
    </section>
  );
}

function ProjectOverviewPage() {
  const params = useUnit(projectsRoute.$params);
  return (
    <div data-testid="project-overview">
      <h2>Overview</h2>
      <p>
        Project id: <strong>{params().projectId}</strong>
      </p>
    </div>
  );
}

function ProjectTaskPage() {
  const params = useUnit(projectTaskRoute.$params);
  const task = () => taskNames[params().taskId] ?? params().taskId;
  const taskLink = useLink(
    projectTaskRoute,
    () =>
      ({ projectId: 'solid', taskId: params().taskId }) as unknown as {
        projectId: string;
        taskId: string;
      },
  );

  return (
    <div data-testid="project-task">
      <h2>{task()}</h2>
      <p>
        Task id: <strong>{params().taskId}</strong>
      </p>
      <button
        data-testid="custom-task-link"
        type="button"
        onClick={() =>
          taskLink.onOpen({
            params: { projectId: 'solid', taskId: params().taskId } as any,
          })
        }
      >
        Open in Solid project
      </button>
      <span data-testid="custom-task-path" class="muted">
        {taskLink.path()}
      </span>
    </div>
  );
}

function SearchPage() {
  const currentQuery = useUnit(router.$query);
  const enterSearch = useUnit(searchTracker.enter);
  const exitSearch = useUnit(searchTracker.exit);
  const [term, setTerm] = createSignal('solid');

  createEffect(() => {
    const value = currentQuery().q;
    if (typeof value === 'string') setTerm(value);
  });

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const value = term().trim();
    if (value) enterSearch({ q: value });
  };

  return (
    <section data-testid="page-search">
      <span class="eyebrow">Query tracker</span>
      <h1>Search</h1>
      <form onSubmit={submit} class="search-form">
        <input
          data-testid="search-input"
          value={term()}
          onInput={(event) => setTerm(event.currentTarget.value)}
        />
        <button data-testid="search-submit" type="submit">
          Apply
        </button>
        <button
          data-testid="search-clear"
          type="button"
          onClick={() => exitSearch()}
        >
          Clear
        </button>
      </form>
      <p data-testid="search-value">
        Active query: {currentQuery().q ?? 'none'}
      </p>
    </section>
  );
}

function ProtectedPage() {
  const authorized = useUnit($authorized);

  return (
    <section data-testid="page-protected">
      <span class="eyebrow">Guarded route</span>
      <h1>Protected workspace</h1>
      <p data-testid="auth-state">
        Authorization: {authorized() ? 'enabled' : 'disabled'}
      </p>
    </section>
  );
}

function GuardControls() {
  const authorized = useUnit($authorized);
  const changeAuth = useUnit(authChanged);
  const currentRouter = useRouter();

  return (
    <div class="guard-controls">
      <span>Auth: {authorized() ? 'enabled' : 'disabled'}</span>
      <button
        data-testid="toggle-auth"
        type="button"
        onClick={() => changeAuth(!authorized())}
      >
        Toggle auth
      </button>
      <button
        data-testid="retry-protected"
        type="button"
        onClick={() =>
          currentRouter.onNavigate({ path: '/protected', query: {} })
        }
      >
        Retry protected
      </button>
    </div>
  );
}

function SettingsPage() {
  return (
    <section data-testid="page-settings">
      <span class="eyebrow">Nested router</span>
      <h1>Settings</h1>
      <div class="tabs">
        <Link to={settingsGeneralRoute}>General</Link>
        <Link to={settingsProfileRoute}>Profile</Link>
      </div>
      <SettingsRoutes />
    </section>
  );
}

const SettingsRoutes = createRoutesView({
  routes: [
    createRouteView({
      route: settingsGeneralRoute,
      view: () => <div data-testid="settings-general">General settings</div>,
    }),
    createRouteView({
      route: settingsProfileRoute,
      view: () => <div data-testid="settings-profile">Profile settings</div>,
    }),
  ],
  otherwise: () => <div data-testid="settings-empty">Choose a setting</div>,
});

function HelpPage() {
  return (
    <section data-testid="page-help">
      <h1>Help</h1>
      <p>Pathless route mapped to /help.</p>
    </section>
  );
}

function NotFoundPage() {
  return (
    <section data-testid="page-not-found">
      <span class="eyebrow">404</span>
      <h1>Page not found</h1>
    </section>
  );
}

function ModalLauncher() {
  return (
    <div class="modal-launcher">
      <Link
        data-testid="open-modal"
        to={modalTaskRoute}
        params={{ taskId: 'route-contracts' }}
      >
        Open task modal
      </Link>
    </div>
  );
}

function TaskModal() {
  const params = useUnit(modalTaskRoute.$params);
  const modal = useRouter();
  return (
    <div class="modal-backdrop">
      <section data-testid="task-modal" class="modal" role="dialog">
        <span class="eyebrow">Query router</span>
        <h2>{taskNames[params().taskId] ?? params().taskId}</h2>
        <p>Modal route: {params().taskId}</p>
        <button
          data-testid="close-modal"
          type="button"
          onClick={() => modal.onNavigate({ path: '/', query: {} })}
        >
          Close
        </button>
      </section>
    </div>
  );
}

const ModalRoutes = createRoutesView({
  routes: [createRouteView({ route: modalTaskRoute, view: TaskModal })],
});

const homeView = createRouteView({ route: homeRoute, view: HomePage });
const searchView = createRouteView({ route: searchRoute, view: SearchPage });
const projectView = createRouteView({
  route: projectsRoute,
  view: ProjectPage,
  layout: (props) => <div class="project-layout">{props.children}</div>,
  children: [
    createRouteView({ route: projectOverviewRoute, view: ProjectOverviewPage }),
    createRouteView({ route: projectTaskRoute, view: ProjectTaskPage }),
  ],
});
const reportsView = createLazyRouteView({
  route: reportsRoute,
  view: () => import('./pages/ReportsPage'),
  fallback: () => (
    <section data-testid="page-reports-loading">
      <h1>Loading reports</h1>
    </section>
  ),
  layout: MainLayout,
});
const protectedView = createRouteView({
  route: protectedVisibleRoute,
  view: ProtectedPage,
});
const settingsView = createRouteView({
  route: settingsRouter,
  view: SettingsPage,
});
const helpView = createRouteView({ route: helpRoute, view: HelpPage });

const mainViews = [
  ...withLayout(MainLayout, [homeView, searchView, helpView]),
  projectView,
  reportsView,
  protectedView,
  settingsView,
];

const MainRoutes = createRoutesView({
  routes: mainViews,
  otherwise: NotFoundPage,
});

function ActiveViews() {
  const views = useOpenedViews(mainViews);
  const labels = new Map<any, string>([
    [homeRoute, 'home'],
    [searchRoute, 'search'],
    [projectsRoute, 'projects'],
    [reportsRoute, 'reports'],
    [protectedVisibleRoute, 'protected'],
    [settingsRouter, 'settings'],
    [helpRoute, 'help'],
  ]);

  return (
    <div data-testid="active-views" class="inspector-row">
      <span>Views</span>
      <strong>
        {views()
          .map((view) => labels.get(view.route as any) ?? 'nested')
          .join(' > ') || 'none'}
      </strong>
    </div>
  );
}

function Inspector() {
  const currentRouter = useRouter();
  const contextRouter = useRouterContext();
  const reportsOpened = useIsOpened(reportsRoute);
  const settingsOpened = useIsOpened(settingsRouter);
  const projectGroupOpened = useIsOpened(projectGroup as any);

  return (
    <aside class="inspector" aria-label="Router state">
      <div class="inspector-heading">
        <span>Router state</span>
        <span class="status-chip">
          {contextRouter.knownRoutes.length} routes
        </span>
      </div>
      <div data-testid="router-path" class="inspector-row">
        <span>Path</span>
        <strong>{currentRouter.path()}</strong>
      </div>
      <div data-testid="router-query" class="inspector-row">
        <span>Query</span>
        <strong>{JSON.stringify(currentRouter.query())}</strong>
      </div>
      <div class="inspector-row">
        <span>Reports</span>
        <strong>{reportsOpened() ? 'open' : 'closed'}</strong>
      </div>
      <div class="inspector-row">
        <span>Settings</span>
        <strong>{settingsOpened() ? 'open' : 'closed'}</strong>
      </div>
      <div class="inspector-row">
        <span>Project group</span>
        <strong>{projectGroupOpened() ? 'open' : 'closed'}</strong>
      </div>
      <ActiveViews />
      <div class="inspector-actions">
        <button
          data-testid="router-back"
          type="button"
          onClick={() => currentRouter.onBack()}
        >
          Back
        </button>
        <button
          data-testid="router-forward"
          type="button"
          onClick={() => currentRouter.onForward()}
        >
          Forward
        </button>
      </div>
    </aside>
  );
}

function Drawer() {
  const opened = useUnit(drawerRoute.$isOpened);
  const drawer = useUnit(drawerRoute);
  const closeDrawer = useUnit(drawerRoute.close);
  return (
    <Show when={opened()}>
      <div data-testid="activity-drawer" class="drawer">
        <span>Activity panel: {drawer.params()?.panel}</span>
        <button
          data-testid="close-drawer"
          type="button"
          onClick={() => closeDrawer()}
        >
          Close
        </button>
      </div>
    </Show>
  );
}

export function App() {
  return (
    <RouterProvider router={router}>
      <div class="app-grid">
        <GuardControls />
        <MainRoutes />
        <Inspector />
        <Drawer />
        <RouterProvider router={modalRouter}>
          <ModalLauncher />
          <ModalRoutes />
        </RouterProvider>
      </div>
    </RouterProvider>
  );
}
