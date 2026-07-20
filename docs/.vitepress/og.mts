import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { HeadConfig, PageData, SiteConfig } from 'vitepress';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

/**
 * Build-time Open Graph card generation.
 *
 * Every documentation page gets its own 1200x630 preview so a link pasted into
 * Telegram, X or Slack shows the page title and summary — not one card repeated
 * across the whole site. Rendered with Satori (HTML/CSS-ish tree -> SVG) and
 * resvg (SVG -> PNG), entirely in-process: no headless browser, so it runs the
 * same on a laptop and in CI.
 */

const dir = path.dirname(fileURLToPath(import.meta.url));
const fontFile = (pkg: string, file: string) =>
  fs.readFileSync(path.resolve(dir, '..', 'node_modules', pkg, 'files', file));

// Loaded once and reused for every card. @fontsource ships woff, which Satori
// reads directly (woff2 is not supported).
const fonts = [
  {
    name: 'Inter',
    weight: 400 as const,
    style: 'normal' as const,
    data: fontFile('@fontsource/inter', 'inter-latin-400-normal.woff'),
  },
  {
    name: 'Inter',
    weight: 700 as const,
    style: 'normal' as const,
    data: fontFile('@fontsource/inter', 'inter-latin-700-normal.woff'),
  },
  {
    name: 'JetBrains Mono',
    weight: 500 as const,
    style: 'normal' as const,
    data: fontFile(
      '@fontsource/jetbrains-mono',
      'jetbrains-mono-latin-500-normal.woff',
    ),
  },
];

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Pull the first prose paragraph out of a page so link previews show what the
 * page is actually about instead of repeating the site description.
 */
function firstParagraph(relativePath: string): string | undefined {
  let raw: string;
  try {
    raw = fs.readFileSync(path.resolve(dir, '..', relativePath), 'utf-8');
  } catch {
    return undefined;
  }

  const body = raw
    .replace(/\r\n/g, '\n') // normalize CRLF so the strips below match
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

/** Turn a page's source path into a stable, filesystem-safe image slug. */
export function pathToSlug(relativePath: string): string {
  const trimmed = relativePath
    .replace(/(?:^|\/)index\.md$/, '')
    .replace(/\.md$/, '');
  return trimmed === '' ? 'index' : trimmed.replace(/\//g, '-');
}

/** Human label for the section a page belongs to, shown on its card. */
const SECTIONS: Record<string, string> = {
  introduction: 'Introduction',
  core: 'Core',
  paths: 'Paths',
  react: 'React',
  vue: 'Vue',
  solid: 'Solid',
  'react-native': 'React Native',
};

export function sectionLabel(relativePath: string): string | undefined {
  return SECTIONS[relativePath.split('/')[0]];
}

/** Minimal hyperscript so the card reads as a tree without a JSX toolchain. */
type Node = { type: string; props: Record<string, unknown> };
const h = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
): Node => ({ type, props: { style, children } });

export interface CardInput {
  title: string;
  description: string;
  section?: string;
  /** Home shows the brand claims; API pages show the section instead. */
  chips?: string[];
  /** Render the richer landing card instead of the plain doc card. */
  home?: boolean;
  /** Version pill, home card only. */
  version?: string;
  /** Pre-broken headline for the home card; falls back to `title`. */
  headline?: string;
}

/**
 * The landing card. Distinct from doc pages: warmer layered background, a big
 * two-line gradient headline, a mono "navigation is state" motif, and a
 * version pill.
 */
function homeTemplate({
  title,
  description,
  chips,
  version,
  headline,
}: CardInput): Node {
  return h(
    'div',
    {
      width: WIDTH,
      height: HEIGHT,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 80px',
      backgroundColor: '#0d0d10',
      // Soft full-canvas radials (no hard edges — satori has no blur). Warmer
      // and busier than the doc card, so the landing reads as the hero.
      backgroundImage:
        'radial-gradient(1100px 620px at 108% -12%, rgba(255,117,24,0.30), rgba(13,13,16,0)), ' +
        'radial-gradient(720px 520px at 88% 4%, rgba(255,193,120,0.18), rgba(13,13,16,0)), ' +
        'radial-gradient(780px 560px at -8% 118%, rgba(232,89,12,0.20), rgba(13,13,16,0))',
      color: '#f6f6f7',
      fontFamily: 'Inter',
    },
    [
      // Eyebrow: package + version pill.
      h(
        'div',
        {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        [
          h(
            'div',
            { fontFamily: 'JetBrains Mono', fontSize: 32, color: '#ff8a3d' },
            '@effector/router',
          ),
          version
            ? h(
                'div',
                {
                  display: 'flex',
                  padding: '8px 20px',
                  borderRadius: 9999,
                  border: '1px solid rgba(255,138,61,0.4)',
                  backgroundColor: 'rgba(255,117,24,0.10)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 24,
                  color: '#ffb347',
                },
                `v${version}`,
              )
            : h('div', {}, ''),
        ],
      ),
      // Headline + tagline + motif.
      h('div', { display: 'flex', flexDirection: 'column' }, [
        h(
          'div',
          {
            display: 'flex',
            whiteSpace: 'pre-wrap',
            fontSize: 88,
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
            fontWeight: 700,
            // One gradient box spanning both lines keeps the sweep continuous.
            backgroundImage:
              'linear-gradient(115deg, #ff6a00 8%, #ff8a3d 48%, #ffc178 92%)',
            backgroundClip: 'text',
            color: 'transparent',
          },
          headline ?? title,
        ),
        h(
          'div',
          {
            marginTop: 24,
            maxWidth: 940,
            fontSize: 33,
            lineHeight: 1.35,
            color: '#c4c4cb',
          },
          description,
        ),
        // "navigation is state" — the core pitch, as observable units.
        h(
          'div',
          {
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            marginTop: 30,
            fontFamily: 'JetBrains Mono',
            fontSize: 25,
          },
          [
            h('div', { color: '#ff8a3d' }, '$isOpened'),
            h('div', { color: '#4b4b52' }, '·'),
            h('div', { color: '#ff8a3d' }, '$params'),
            h('div', { color: '#4b4b52' }, '·'),
            h('div', { color: '#ff8a3d' }, 'opened'),
            h('div', { color: '#4b4b52' }, '·'),
            h('div', { color: '#ff8a3d' }, 'closed'),
          ],
        ),
      ]),
      // Footer: brand chips + domain.
      h(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        [
          h(
            'div',
            { display: 'flex', gap: 14 },
            (chips ?? []).map((chip) =>
              h(
                'div',
                {
                  display: 'flex',
                  padding: '10px 22px',
                  borderRadius: 9999,
                  border: '1px solid #2e2e32',
                  backgroundColor: 'rgba(24,24,28,0.7)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 24,
                  color: '#c9c9ce',
                },
                chip,
              ),
            ),
          ),
          h(
            'div',
            { fontFamily: 'JetBrains Mono', fontSize: 24, color: '#8a8a92' },
            'router.effector.dev',
          ),
        ],
      ),
    ],
  );
}

function template({ title, description, section, chips }: CardInput): Node {
  return h(
    'div',
    {
      width: WIDTH,
      height: HEIGHT,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '72px 80px',
      backgroundColor: '#101014',
      backgroundImage:
        'radial-gradient(900px 500px at 100% 0%, rgba(255,117,24,0.20), rgba(16,16,20,0)), ' +
        'radial-gradient(700px 400px at 0% 100%, rgba(255,138,61,0.10), rgba(16,16,20,0))',
      color: '#f6f6f7',
      fontFamily: 'Inter',
    },
    [
      // Top: eyebrow row + title + description.
      h('div', { display: 'flex', flexDirection: 'column' }, [
        h(
          'div',
          {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          },
          [
            h(
              'div',
              {
                fontFamily: 'JetBrains Mono',
                fontSize: 30,
                color: '#ff8a3d',
              },
              '@effector/router',
            ),
            section
              ? h(
                  'div',
                  {
                    fontFamily: 'JetBrains Mono',
                    fontSize: 24,
                    color: '#7c7c85',
                  },
                  section,
                )
              : h('div', {}, ''),
          ],
        ),
        h(
          'div',
          {
            marginTop: 28,
            fontSize: 76,
            lineHeight: 1.08,
            letterSpacing: '-0.035em',
            fontWeight: 700,
            // Gradient fill on the glyphs. Satori clips the gradient to the
            // text without the descender-cropping that plagues a CSS box.
            backgroundImage: 'linear-gradient(120deg, #ff7a18 25%, #ffb347)',
            backgroundClip: 'text',
            color: 'transparent',
          },
          title,
        ),
        h(
          'div',
          {
            marginTop: 26,
            maxWidth: 1000,
            fontSize: 48,
            lineHeight: 1.4,
            color: '#b8b8bd',
          },
          description,
        ),
      ]),
      // Footer: brand chips (home only) + domain.
      h(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        [
          h(
            'div',
            { display: 'flex', gap: 14 },
            (chips ?? []).map((chip) =>
              h(
                'div',
                {
                  display: 'flex',
                  padding: '10px 22px',
                  borderRadius: 999,
                  border: '1px solid #2e2e32',
                  backgroundColor: '#18181c',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 24,
                  color: '#c9c9ce',
                },
                chip,
              ),
            ),
          ),
          h(
            'div',
            { fontFamily: 'JetBrains Mono', fontSize: 24, color: '#7c7c85' },
            'router.effector.dev',
          ),
        ],
      ),
    ],
  );
}

/** Render a single card to a PNG buffer. */
export async function renderCard(input: CardInput): Promise<Buffer> {
  const tree = input.home ? homeTemplate(input) : template(input);
  const svg = await satori(tree as never, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } })
    .render()
    .asPng();
}

/** Per-page overrides read from the `og:` frontmatter block. */
export interface PageOg {
  /** Two-line headline for the home card; falls back to the page title. */
  headline?: string;
  /** Brand claim chips (home card only). */
  chips?: string[];
}

export interface OgImagesOptions {
  /** Absolute site origin, e.g. `https://router.effector.dev`. */
  site: string;
  /** Brand name, used in titles and `og:site_name`. */
  siteTitle: string;
  /** Fallback description for pages that have none of their own. */
  siteDescription: string;
  /** Rendered as a pill on the landing card. */
  version: string;
}

/** The config fragments a caller spreads into `defineConfig`. */
export interface OgImagesPlugin {
  head: HeadConfig[];
  transformPageData: (pageData: PageData) => void;
  buildEnd: (siteConfig: SiteConfig) => Promise<void>;
}

/**
 * VitePress "plugin" for per-page Open Graph cards. VitePress has no formal
 * plugin API, so this returns the config fragments to wire in:
 *
 *   const og = createOgImages({ site, siteTitle, siteDescription, version });
 *   defineConfig({
 *     head: [...yourHead, ...og.head],
 *     transformPageData: og.transformPageData,
 *     buildEnd: og.buildEnd,
 *   });
 *
 * `transformPageData` runs per page during build: it adds the meta tags and
 * records what each card should say. `buildEnd` then renders every recorded
 * card into `dist/og/<slug>.png` — all inside `vitepress build`, no extra step.
 */
export function createOgImages(options: OgImagesOptions): OgImagesPlugin {
  const { site, siteTitle, siteDescription, version } = options;
  // Collected in transformPageData, consumed in buildEnd. Keyed by the same
  // slug the og:image URL uses, so tag and file always agree.
  const cards = new Map<string, CardInput>();

  return {
    head: [
      ['meta', { property: 'og:site_name', content: siteTitle }],
      ['meta', { property: 'og:image:width', content: `${WIDTH}` }],
      ['meta', { property: 'og:image:height', content: `${HEIGHT}` }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ],

    transformPageData(pageData) {
      const fm = pageData.frontmatter;
      const hero = fm.hero as { text?: string; tagline?: string } | undefined;
      const og = (fm.og ?? {}) as PageOg;
      // The home page is the only one with a `home` layout and a hero, so the
      // few genuine differences hang off this single flag.
      const isHome = fm.layout === 'home';

      // Home derives its title from the hero; other pages from their heading.
      const pageTitle = hero?.text ?? fm.title ?? pageData.title;
      const title = isHome
        ? `${siteTitle} — ${pageTitle}`
        : `${pageTitle} · ${siteTitle}`;
      // Meta description: the page's own, else its first prose paragraph (the
      // home page has none, so it falls through to the site description).
      const description =
        fm.description ??
        firstParagraph(pageData.relativePath) ??
        siteDescription;
      const url = `${site}/${pageData.relativePath
        .replace(/index\.md$/, '')
        .replace(/\.md$/, '')}`;

      const slug = pathToSlug(pageData.relativePath);
      const image = `${site}/og/${slug}.png`;
      // On a section's overview page the title already is the section name, so
      // the corner label would just repeat it — drop it there.
      const section = sectionLabel(pageData.relativePath);
      cards.set(slug, {
        title: pageTitle,
        // The hero tagline reads better on the card than the keyword-stuffed
        // meta description; only the home page has one.
        description: hero?.tagline ?? description,
        section: section === pageTitle ? undefined : section,
        chips: og.chips,
        headline: og.headline,
        home: isHome,
        version: isHome ? version : undefined,
      });

      pageData.frontmatter.head ??= [];
      pageData.frontmatter.head.push(
        ['link', { rel: 'canonical', href: url }],
        [
          'meta',
          { property: 'og:type', content: isHome ? 'website' : 'article' },
        ],
        ['meta', { property: 'og:title', content: title }],
        ['meta', { property: 'og:description', content: description }],
        ['meta', { property: 'og:url', content: url }],
        ['meta', { property: 'og:image', content: image }],
        ['meta', { property: 'og:image:alt', content: title }],
        ['meta', { name: 'twitter:title', content: title }],
        ['meta', { name: 'twitter:description', content: description }],
        ['meta', { name: 'twitter:image', content: image }],
      );
    },

    async buildEnd({ outDir }) {
      const ogDir = path.join(outDir, 'og');
      fs.mkdirSync(ogDir, { recursive: true });
      await Promise.all(
        [...cards].map(async ([slug, card]) => {
          fs.writeFileSync(
            path.join(ogDir, `${slug}.png`),
            await renderCard(card),
          );
        }),
      );
      console.log(`generated ${cards.size} og images`);
    },
  };
}
