import { allSettled, createEffect, fork } from 'effector';
import { Provider, useUnit } from 'effector-solid';
import { describe, expect, test } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import {
  chainRoute,
  createRoute,
  createRouter,
  historyAdapter,
  type RouteOpenedPayload,
} from '@effector/router';
import { createMemoryHistory } from 'history';

import {
  createRouteView,
  createRoutesView,
  Link,
  RouterProvider,
} from '../lib';

// --- "database" -----------------------------------------------------------
const posts: Record<string, string> = {
  '1': 'Hello world',
  '2': 'Effector rules',
};

// --- routes ---------------------------------------------------------------
const homeRoute = createRoute({ path: '/' });
const postRoute = createRoute({ path: '/post/:id' });

// Guard the post route: only open it when the requested post exists.
// When the effect rejects, `cancelOn` keeps the virtual route closed, so the
// routes view falls through to the `otherwise` (404) fallback.
const loadPostFx = createEffect(
  ({ params }: RouteOpenedPayload<{ id: string }>) => {
    const title = posts[params.id];
    if (!title) {
      throw new Error(`Post "${params.id}" not found`);
    }
    return title;
  },
);

const postVisible = chainRoute({
  route: postRoute,
  beforeOpen: loadPostFx,
  openOn: loadPostFx.done,
  cancelOn: loadPostFx.fail,
});

// --- pages ----------------------------------------------------------------
function HomePage() {
  return (
    <div data-testid="page">
      <h1>Home</h1>
      <Link to={postRoute} params={{ id: '1' }}>
        Read first post
      </Link>
    </div>
  );
}

function PostPage() {
  const params = useUnit(postVisible.$params);
  return (
    <div data-testid="page">
      <h1>Post</h1>
      <p data-testid="post-title">{posts[params().id]}</p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div data-testid="page">
      <h1>404 — Not Found</h1>
    </div>
  );
}

const RoutesView = createRoutesView({
  routes: [
    createRouteView({ route: homeRoute, view: HomePage }),
    createRouteView({ route: postVisible, view: PostPage }),
  ],
  otherwise: NotFoundPage,
});

function setup(initialPath: string) {
  const scope = fork();
  const router = createRouter({ routes: [homeRoute, postRoute] });
  const history = createMemoryHistory({ initialEntries: [initialPath] });

  render(() => (
    <Provider value={scope}>
      <RouterProvider router={router}>
        <RoutesView />
      </RouterProvider>
    </Provider>
  ));

  return { scope, router, history };
}

describe('example app routing', () => {
  test('renders the home page on "/"', async () => {
    const { scope, router, history } = setup('/');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    expect(screen.getByTestId('page').textContent).toContain('Home');
  });

  test('renders the post page for an existing post', async () => {
    const { scope, router, history } = setup('/');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    history.push('/post/2');
    await allSettled(scope);

    expect(screen.getByTestId('page').textContent).toContain('Post');
    expect(screen.getByTestId('post-title').textContent).toBe('Effector rules');
  });

  test('shows 404 when the post does not exist', async () => {
    const { scope, router, history } = setup('/');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    // URL matches /post/:id, but there is no post with this id
    history.push('/post/999');
    await allSettled(scope);

    expect(screen.getByTestId('page').textContent).toContain('404');
  });

  test('shows 404 for an unknown / malformed url', async () => {
    const { scope, router, history } = setup('/');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    // No route matches this path at all
    history.push('/this/does/not/exist');
    await allSettled(scope);

    expect(screen.getByTestId('page').textContent).toContain('404');
  });

  test('recovers from 404 back to a real page', async () => {
    const { scope, router, history } = setup('/');

    await allSettled(router.setHistory, {
      scope,
      params: historyAdapter(history),
    });

    history.push('/nope');
    await allSettled(scope);
    expect(screen.getByTestId('page').textContent).toContain('404');

    history.push('/post/1');
    await allSettled(scope);
    expect(screen.getByTestId('post-title').textContent).toBe('Hello world');
  });
});
