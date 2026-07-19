import { defineConfig } from 'vitepress';

import path from 'path';
import fs from 'fs';

const { version } = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../packages/core/package.json'), {
    encoding: 'utf-8',
  }),
);

const site = 'https://router.effector.dev';
const ogImage = `${site}/og.png`;
const siteTitle = '@effector/router';
const siteDescription =
  'A route is a unit of logic. Model navigation as state and events with Effector — routes without URLs, type-safe params, transition policy, SSR by design.';

/**
 * Pull the first prose paragraph out of a page so link previews show what the
 * page is actually about instead of repeating the site description.
 */
function firstParagraph(relativePath: string): string | undefined {
  let raw: string;
  try {
    raw = fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf-8');
  } catch {
    return undefined;
  }

  const body = raw
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/```[\s\S]*?```/g, '');

  for (const block of body.split(/\n\s*\n/)) {
    const text = block.trim();
    if (!text || /^[#>\-*|:]/.test(text)) continue;
    const plain = text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/[`*_]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (plain.length < 40) continue;
    return plain.length > 180 ? `${plain.slice(0, 177).trimEnd()}…` : plain;
  }
  return undefined;
}

export default defineConfig({
  title: 'effector router',
  description: siteDescription,
  base: '/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#ff7518' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: siteTitle }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    [
      'meta',
      {
        property: 'og:image:alt',
        content: '@effector/router — a route is a unit of logic',
      },
    ],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: ogImage }],
  ],
  transformPageData(pageData) {
    const isHome = pageData.frontmatter.layout === 'home';
    const title = isHome
      ? `${siteTitle} — a route is a unit of logic`
      : `${pageData.frontmatter.title ?? pageData.title} · ${siteTitle}`;
    const description =
      pageData.frontmatter.description ??
      (isHome ? undefined : firstParagraph(pageData.relativePath)) ??
      siteDescription;
    const url = `${site}/${pageData.relativePath
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '')}`;

    pageData.frontmatter.head ??= [];
    pageData.frontmatter.head.push(
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
    );
  },
  themeConfig: {
    logo: './logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Introduction', link: '/introduction/getting-started' },
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

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting started', link: '/introduction/getting-started' },
          { text: 'Web Link matrix', link: '/link-matrix' },
        ],
      },
      {
        text: 'Core',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/core/' },
          { text: 'createRoute', link: '/core/create-route' },
          { text: 'createRouter', link: '/core/create-router' },
          {
            text: 'createRouterControls',
            link: '/core/create-router-controls',
          },
          { text: 'Adapters', link: '/core/adapters' },
          {
            text: 'Navigation lifecycle',
            link: '/core/navigation-lifecycle',
          },
          { text: 'beforeNavigate', link: '/core/before-navigate' },
          { text: 'redirect', link: '/core/redirect' },
          { text: 'trackQuery', link: '/core/track-query' },
          { text: 'chainRoute', link: '/core/chain-route' },
          { text: 'group', link: '/core/group' },
          { text: 'createVirtualRoute', link: '/core/create-virtual-route' },
        ],
      },
      {
        text: 'Paths',
        collapsed: false,
        items: [{ text: 'Overview', link: '/paths/' }],
      },
      {
        text: 'React',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/react/' },
          { text: 'RouterProvider', link: '/react/router-provider' },
          { text: 'createRouteView', link: '/react/create-route-view' },
          {
            text: 'createLazyRouteView',
            link: '/react/create-lazy-route-view',
          },
          { text: 'createRoutesView', link: '/react/create-routes-view' },
          { text: 'Link', link: '/react/link' },
          { text: 'Outlet', link: '/react/outlet' },
          { text: 'useRouter', link: '/react/use-router' },
          { text: 'useLink', link: '/react/use-link' },
          { text: 'useIsOpened', link: '/react/use-is-opened' },
          { text: 'useOpenedViews', link: '/react/use-opened-views' },
          { text: 'withLayout', link: '/react/with-layout' },
        ],
      },
      {
        text: 'Vue β',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/vue/' },
          { text: 'RouterProvider', link: '/vue/router-provider' },
          { text: 'createRouteView', link: '/vue/create-route-view' },
          {
            text: 'createLazyRouteView',
            link: '/vue/create-lazy-route-view',
          },
          { text: 'createRoutesView', link: '/vue/create-routes-view' },
          { text: 'Link', link: '/vue/link' },
          { text: 'Outlet', link: '/vue/outlet' },
          { text: 'useRouter', link: '/vue/use-router' },
          { text: 'useLink', link: '/vue/use-link' },
          { text: 'useIsOpened', link: '/vue/use-is-opened' },
          { text: 'useOpenedViews', link: '/vue/use-opened-views' },
          { text: 'withLayout', link: '/vue/with-layout' },
        ],
      },
      {
        text: 'React Native β',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/react-native/' },
          {
            text: 'Stack Navigator',
            link: '/react-native/stack-navigator',
          },
          {
            text: 'Bottom Tabs Navigator',
            link: '/react-native/bottom-tabs-navigator',
          },
        ],
      },
      {
        text: 'Solid β',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/solid/' },
          { text: 'RouterProvider', link: '/solid/router-provider' },
          { text: 'createRouteView', link: '/solid/create-route-view' },
          {
            text: 'createLazyRouteView',
            link: '/solid/create-lazy-route-view',
          },
          { text: 'createRoutesView', link: '/solid/create-routes-view' },
          { text: 'Link', link: '/solid/link' },
          { text: 'Outlet', link: '/solid/outlet' },
          { text: 'useRouter', link: '/solid/use-router' },
          { text: 'useLink', link: '/solid/use-link' },
          { text: 'useIsOpened', link: '/solid/use-is-opened' },
          { text: 'useOpenedViews', link: '/solid/use-opened-views' },
          { text: 'withLayout', link: '/solid/with-layout' },
        ],
      },
    ],

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
