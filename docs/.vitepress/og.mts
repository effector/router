import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
            fontSize: 32,
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
