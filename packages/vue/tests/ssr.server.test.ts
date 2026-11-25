// @vitest-environment node
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderOnServer } from './fixtures/ssr-app';

// Core tells a server from a client by `typeof window`, so the server render
// runs in the node environment. The history is attached before the render.
describe('server render', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('the environment has no window and no document', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
  });

  test('plain view: the opened page is in the HTML', async () => {
    const { html, scope, app } = await renderOnServer('/profile/1');

    expect(scope.getState(app.routes.profile.$isOpened)).toBe(true);
    expect(scope.getState(app.routes.profile.$params)).toEqual({ id: '1' });
    expect(html).toContain('data-page="profile"');
    expect(html).not.toContain('data-page="home"');
    expect(html).not.toContain('data-page="settings"');
  });

  test('Link renders href and its active state without window', async () => {
    const { html } = await renderOnServer('/profile/1?tab=a');

    // An omitted query keeps the query of the router.
    expect(html).toContain('<a data-link="home" href="/?tab=a">to home</a>');
    expect(html).toContain(
      '<a aria-current="page" data-link="profile" href="/profile/1?tab=a">to profile</a>',
    );
    expect(html).toContain(
      '<a data-link="lazy" href="/lazy/7?tab=a">to lazy</a>',
    );
  });

  test('nested Outlet: the child page is inside the parent page', async () => {
    const { html } = await renderOnServer('/profile/1/settings');

    expect(html).toMatch(
      /<section data-page="profile">.*<div data-page="settings">settings<\/div>.*<\/section>/,
    );
  });

  test('lazy view: the page is rendered, not the fallback', async () => {
    const { html, app } = await renderOnServer('/lazy/7', { lazyDelay: 30 });

    expect(app.counters.loaderCalls).toBe(1);
    expect(html).toBe(
      '<!--[--><article data-page="lazy">lazy page</article><!--]-->',
    );
  });

  test('layout group: the layout wraps the page', async () => {
    const { html } = await renderOnServer('/about');

    expect(html).toBe(
      '<!--[--><div data-layout="group"><div data-page="about">about</div></div><!--]-->',
    );
  });

  test('layout group with a lazy view: the layout wraps the loaded page', async () => {
    const { html } = await renderOnServer('/contacts', { lazyDelay: 30 });

    expect(html).toBe(
      '<!--[--><div data-layout="group"><article data-page="lazy">lazy page</article></div><!--]-->',
    );
  });

  test('unknown url: otherwise is rendered', async () => {
    const { html } = await renderOnServer('/nowhere', { otherwise: true });

    expect(html).toBe('<!--[--><p data-otherwise>not found</p><!--]-->');
  });

  // `Link` subscribes through a `watch`. On the server its refs read the
  // scope on access, and the render leaves nothing subscribed.
  test('nothing subscribes to the scope and nothing is reported', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const plain = await renderOnServer('/profile/1/settings');
    const lazy = await renderOnServer('/contacts', { lazyDelay: 30 });

    expect(plain.linksAfter).toBe(plain.linksBefore);
    expect(lazy.linksAfter).toBe(lazy.linksBefore);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
