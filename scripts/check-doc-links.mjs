import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveRewrittenSource } from '../docs/.vitepress/rewrites.mjs';

// Resolved from this file's location, not `process.cwd()`, so the check runs
// the same whether it's invoked from the repo root or via `pnpm :docs
// check-links` (cwd `docs/`).
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = path.join(root, 'docs');
const errors = [];

function markdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? markdownFiles(fullPath)
      : entry.name.endsWith('.md')
        ? [fullPath]
        : [];
  });
}

// A public URL may be served by a file that physically lives elsewhere, via
// VitePress `rewrites` (see docs/.vitepress/rewrites.mjs). Try the direct
// on-disk path first, then fall back to the rewritten source.
function publicPathToFile(value) {
  const clean = value.split(/[?#]/, 1)[0] || '/';
  const withoutHtml = clean.endsWith('.html')
    ? clean.slice(0, -'.html'.length)
    : clean;
  const relative = withoutHtml.replace(/^\//, '');
  const relativeCandidates = [];

  if (!relative) relativeCandidates.push('index.md');
  else if (relative.endsWith('/')) {
    relativeCandidates.push(`${relative}index.md`);
  } else {
    relativeCandidates.push(`${relative}.md`);
    relativeCandidates.push(`${relative}/index.md`);
  }

  for (const rel of relativeCandidates) {
    const direct = path.join(docsRoot, rel);
    if (fs.existsSync(direct)) return direct;

    const rewritten = resolveRewrittenSource(rel);
    if (rewritten) {
      const rewrittenPath = path.join(docsRoot, rewritten);
      if (fs.existsSync(rewrittenPath)) return rewrittenPath;
    }
  }

  return undefined;
}

function checkLink(source, rawLink, kind) {
  const link = rawLink.trim().replace(/^<|>$/g, '');
  if (!link || link.startsWith('#')) return;

  if (/^https?:\/\//.test(link)) {
    if (!link.startsWith('https://router.effector.dev/')) return;
    const target = new URL(link).pathname;
    if (!publicPathToFile(target)) {
      errors.push(`${source}: broken ${kind} ${link}`);
    }
    return;
  }

  if (link.startsWith('/')) {
    if (!publicPathToFile(link))
      errors.push(`${source}: broken ${kind} ${link}`);
    return;
  }

  const target = link.split(/[?#]/, 1)[0];
  if (!target || target.startsWith('mailto:')) return;
  const resolved = path.resolve(path.dirname(source), target);
  const candidates = [resolved];
  if (!path.extname(resolved)) {
    candidates.push(`${resolved}.md`, path.join(resolved, 'index.md'));
  }
  if (!candidates.some((candidate) => fs.existsSync(candidate))) {
    errors.push(`${source}: broken ${kind} ${link}`);
  }
}

for (const file of markdownFiles(docsRoot)) {
  const content = fs.readFileSync(file, 'utf8');
  const links = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of content.matchAll(links))
    checkLink(file, match[1], 'Markdown link');
}

for (const directory of [
  'packages/core/lib',
  'packages/react/lib',
  'packages/solid/lib',
  'packages/vue/lib',
]) {
  for (const file of fs.readdirSync(path.join(root, directory))) {
    if (!/\.(?:ts|tsx)$/.test(file)) continue;
    const source = path.join(root, directory, file);
    const content = fs.readFileSync(source, 'utf8');
    for (const match of content.matchAll(
      /@link\s+(https:\/\/router\.effector\.dev\/\S+)/g,
    )) {
      checkLink(source, match[1], 'JSDoc link');
    }
  }
}

const config = fs.readFileSync(
  path.join(docsRoot, '.vitepress/config.mts'),
  'utf8',
);
const sidebarLinks = [...config.matchAll(/link:\s*['"]([^'"]+)['"]/g)]
  .map((match) => match[1])
  .filter((link) => link.startsWith('/'));
for (const link of sidebarLinks)
  checkLink('docs/.vitepress/config.mts', link, 'sidebar link');

const sidebarFiles = new Set(
  sidebarLinks
    .map(publicPathToFile)
    .filter(Boolean)
    .map((file) => path.normalize(file)),
);
for (const section of ['tutorials', 'reference', 'explanation', 'how-to']) {
  for (const file of markdownFiles(path.join(docsRoot, section))) {
    if (path.basename(file) === 'index.md') continue;
    if (!sidebarFiles.has(path.normalize(file))) {
      errors.push(
        `${file}: public API page is missing from the VitePress sidebar`,
      );
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Documentation links OK (${sidebarLinks.length} sidebar entries checked).`,
  );
}
