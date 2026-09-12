import { defineConfig } from 'vitepress';

import path from 'path';
import fs from 'fs';

import { createOgImages } from './og.mjs';
import { rewrites } from './rewrites.mjs';

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../packages/core/package.json'), {
    encoding: 'utf-8',
  }),
);

const site = 'https://router.effector.dev';
const siteTitle = '@effector/router';
const siteDescription =
  'A route is a unit of logic. Model navigation as state and events with Effector — routes without URLs, type-safe params, transition policy, SSR by design.';

// Per-page Open Graph cards. Generates og:image/meta tags and renders the PNGs
// during `vitepress build`; see docs/.vitepress/og.mts.
const og = createOgImages({ site, siteTitle, siteDescription, version });

const coreItems = [
  { text: 'Adapters', link: '/core/adapters' },
  { text: 'Navigation lifecycle', link: '/core/navigation-lifecycle' },
  { text: 'createRoute', link: '/core/create-route' },
  { text: 'createRouter', link: '/core/create-router' },
  { text: 'createRouterControls', link: '/core/create-router-controls' },
  { text: 'createVirtualRoute', link: '/core/create-virtual-route' },
  { text: 'beforeNavigate', link: '/core/before-navigate' },
  { text: 'trackQuery', link: '/core/track-query' },
  { text: 'Query utilities', link: '/core/query-utilities' },
  { text: 'Type guards', link: '/core/type-guards' },
  { text: 'chainRoute', link: '/core/chain-route' },
  { text: 'redirect', link: '/core/redirect' },
  { text: 'group', link: '/core/group' },
];

const reactItems = [
  { text: 'RouterProvider', link: '/react/router-provider' },
  { text: 'Outlet', link: '/react/outlet' },
  { text: 'Link', link: '/react/link' },
  { text: 'createRouteView', link: '/react/create-route-view' },
  { text: 'createRoutesView', link: '/react/create-routes-view' },
  { text: 'createLazyRouteView', link: '/react/create-lazy-route-view' },
  { text: 'useLink', link: '/react/use-link' },
  { text: 'useRouter', link: '/react/use-router' },
  {
    text: 'useRouterContext',
    link: '/react/use-router#useroutercontext',
  },
  { text: 'useIsOpened', link: '/react/use-is-opened' },
  { text: 'useOpenedViews', link: '/react/use-opened-views' },
  { text: 'withLayout', link: '/react/with-layout' },
];

const vueItems = [
  { text: 'RouterProvider', link: '/vue/router-provider' },
  { text: 'RouterInjectionKey', link: '/vue/router-injection-key' },
  { text: 'Outlet', link: '/vue/outlet' },
  { text: 'Link', link: '/vue/link' },
  { text: 'createRouteView', link: '/vue/create-route-view' },
  { text: 'createRoutesView', link: '/vue/create-routes-view' },
  { text: 'createLazyRouteView', link: '/vue/create-lazy-route-view' },
  { text: 'useLink', link: '/vue/use-link' },
  { text: 'useRouter', link: '/vue/use-router' },
  { text: 'useRouterContext', link: '/vue/use-router' },
  { text: 'useIsOpened', link: '/vue/use-is-opened' },
  { text: 'useOpenedViews', link: '/vue/use-opened-views' },
  { text: 'withLayout', link: '/vue/with-layout' },
];

const solidItems = [
  { text: 'RouterProvider', link: '/solid/router-provider' },
  { text: 'Outlet', link: '/solid/outlet' },
  { text: 'Link', link: '/solid/link' },
  { text: 'createRouteView', link: '/solid/create-route-view' },
  { text: 'createRoutesView', link: '/solid/create-routes-view' },
  { text: 'createLazyRouteView', link: '/solid/create-lazy-route-view' },
  { text: 'useLink', link: '/solid/use-link' },
  { text: 'useRouter', link: '/solid/use-router' },
  {
    text: 'useRouterContext',
    link: '/solid/use-router#useroutercontext',
  },
  { text: 'useIsOpened', link: '/solid/use-is-opened' },
  { text: 'useOpenedViews', link: '/solid/use-opened-views' },
  { text: 'withLayout', link: '/solid/with-layout' },
];

const reactNativeItems = [
  { text: 'Stack Navigator', link: '/react-native/stack-navigator' },
  {
    text: 'Bottom Tabs Navigator',
    link: '/react-native/bottom-tabs-navigator',
  },
  { text: 'RouterProvider', link: '/react-native/router-provider' },
  { text: 'Outlet', link: '/react-native/outlet' },
  { text: 'createRouteView', link: '/react-native/create-route-view' },
  { text: 'createRoutesView', link: '/react-native/create-routes-view' },
  {
    text: 'createLazyRouteView',
    link: '/react-native/create-lazy-route-view',
  },
  { text: 'useRouter', link: '/react-native/use-router' },
  { text: 'useRouterContext', link: '/react-native/use-router-context' },
  { text: 'useIsOpened', link: '/react-native/use-is-opened' },
  { text: 'useOpenedViews', link: '/react-native/use-opened-views' },
  { text: 'withLayout', link: '/react-native/with-layout' },
];

export default defineConfig({
  title: 'effector router',
  description: siteDescription,
  base: '/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#ff7518' }],
    ...og.head,
  ],
  transformPageData: og.transformPageData,
  buildEnd: og.buildEnd,
  rewrites,
  themeConfig: {
    logo: './logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Tutorials', link: '/tutorials/build-your-first-router' },
      { text: 'Reference', link: '/reference/' },
      { text: 'Explanation', link: '/explanation/navigation-lifecycle' },
      {
        text: `v${version}`,
        items: [
          {
            items: [
              {
                text: `v${version}`,
                link: `#`,
              },
              {
                text: 'Releases Notes',
                link: 'https://github.com/effector/router/releases',
              },
            ],
          },
        ],
      },
    ],

    sidebar: {
      '/tutorials/': [
        {
          text: 'Tutorials',
          items: [
            {
              text: 'Getting started (install)',
              link: '/introduction/getting-started',
            },
            {
              text: 'Build your first router',
              link: '/tutorials/build-your-first-router',
            },
          ],
        },
      ],
      '/how-to/': [
        {
          text: 'How-to guides',
          items: [{ text: 'Overview', link: '/how-to/' }],
        },
      ],
      '/explanation/': [
        {
          text: 'Explanation',
          items: [
            {
              text: 'Navigation lifecycle',
              link: '/explanation/navigation-lifecycle',
            },
            {
              text: 'Routes and query',
              link: '/explanation/routes-and-query',
            },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Overview', link: '/reference/' },
            { text: 'Paths', link: '/reference/paths' },
            { text: 'Web Link matrix', link: '/reference/link-matrix' },
          ],
        },
        { text: 'Core', collapsed: true, items: coreItems },
        { text: 'React', collapsed: true, items: reactItems },
        { text: 'Vue β', collapsed: true, items: vueItems },
        { text: 'Solid β', collapsed: true, items: solidItems },
        { text: 'React Native β', collapsed: true, items: reactNativeItems },
      ],
      '/core/': [
        {
          text: 'Core',
          items: [{ text: 'Overview', link: '/core/' }, ...coreItems],
        },
      ],
      '/paths/': [
        {
          text: 'Paths',
          items: [
            { text: 'Overview', link: '/paths/' },
            { text: 'Full reference', link: '/reference/paths' },
          ],
        },
      ],
      '/react/': [
        {
          text: 'React',
          items: [{ text: 'Overview', link: '/react/' }, ...reactItems],
        },
      ],
      '/vue/': [
        {
          text: 'Vue β',
          items: [{ text: 'Overview', link: '/vue/' }, ...vueItems],
        },
      ],
      '/solid/': [
        {
          text: 'Solid β',
          items: [{ text: 'Overview', link: '/solid/' }, ...solidItems],
        },
      ],
      '/react-native/': [
        {
          text: 'React Native β',
          items: [
            { text: 'Overview', link: '/react-native/' },
            ...reactNativeItems,
          ],
        },
      ],
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Effector core team',
    },

    socialLinks: [
      {
        icon: { svg: '☄️' },
        link: 'https://github.com/effector',
      },
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256"><defs><linearGradient id="logosTelegram0" x1="50%" x2="50%" y1="0%" y2="100%"><stop offset="0%" stop-color="#2aabee"/><stop offset="100%" stop-color="#229ed9"/></linearGradient></defs><path fill="url(#logosTelegram0)" d="M128 0C94.06 0 61.48 13.494 37.5 37.49A128.04 128.04 0 0 0 0 128c0 33.934 13.5 66.514 37.5 90.51C61.48 242.506 94.06 256 128 256s66.52-13.494 90.5-37.49c24-23.996 37.5-56.576 37.5-90.51s-13.5-66.514-37.5-90.51C194.52 13.494 161.94 0 128 0"/><path fill="#fff" d="M57.94 126.648q55.98-24.384 74.64-32.152c35.56-14.786 42.94-17.354 47.76-17.441c1.06-.017 3.42.245 4.96 1.49c1.28 1.05 1.64 2.47 1.82 3.467c.16.996.38 3.266.2 5.038c-1.92 20.24-10.26 69.356-14.5 92.026c-1.78 9.592-5.32 12.808-8.74 13.122c-7.44.684-13.08-4.912-20.28-9.63c-11.26-7.386-17.62-11.982-28.56-19.188c-12.64-8.328-4.44-12.906 2.76-20.386c1.88-1.958 34.64-31.748 35.26-34.45c.08-.338.16-1.598-.6-2.262c-.74-.666-1.84-.438-2.64-.258c-1.14.256-19.12 12.152-54 35.686c-5.1 3.508-9.72 5.218-13.88 5.128c-4.56-.098-13.36-2.584-19.9-4.708c-8-2.606-14.38-3.984-13.82-8.41c.28-2.304 3.46-4.662 9.52-7.072"/></svg>',
        },
        link: 'https://t.me/effector_ru',
      },
      { icon: 'github', link: 'https://github.com/effector/router' },
    ],
  },
});
