import { defineComponent, h } from 'vue';
import { useUnit } from 'effector-vue/composition';
import { useIsOpened } from '@effector/router-vue';
import { $post, postLoadedRoute } from './model';

const PostSkeleton = defineComponent({
  name: 'PostSkeleton',
  setup: () => () => h('article', { 'aria-busy': 'true' }, 'Loading'),
});

export const PostPage = defineComponent({
  name: 'PostPage',
  setup() {
    const post = useUnit($post);
    // `false` while `beforeOpen` of the chained route loads the post.
    const isLoaded = useIsOpened(postLoadedRoute);

    return () =>
      isLoaded.value
        ? h('article', [h('h1', post.value?.title)])
        : h(PostSkeleton);
  },
});
