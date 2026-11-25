import { createEffect, createStore } from 'effector';
import { chainRoute } from '@effector/router';
import { routes } from '../../shared/routing';

export interface Post {
  id: string;
  title: string;
}

const loadPostFx = createEffect(
  async ({ params }: { params: { id: string } }): Promise<Post> => {
    const response = await fetch(`/api/posts/${params.id}`);

    return (await response.json()) as Post;
  },
);

/**
 * Opens after the post of the current URL is loaded. `routes.post` itself is
 * opened as soon as the URL matches.
 */
export const postLoadedRoute = chainRoute({
  route: routes.post,
  beforeOpen: loadPostFx,
});

export const $post = createStore<Post | null>(null)
  .on(loadPostFx.doneData, (_, post) => post)
  .reset(routes.post.closed);
