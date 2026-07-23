import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
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

function publicPathToFile(value) {
  const clean = value.split(/[?#]/, 1)[0] || '/';
  const withoutHtml = clean.endsWith('.html')
    ? clean.slice(0, -'.html'.length)
    : clean;
  const relative = withoutHtml.replace(/^\//, '');
  const candidates = [];

  if (!relative) candidates.push(path.join(docsRoot, 'index.md'));
  else if (relative.endsWith('/')) {
    candidates.push(path.join(docsRoot, relative, 'index.md'));
  } else {
    candidates.push(path.join(docsRoot, `${relative}.md`));
    candidates.push(path.join(docsRoot, relative, 'index.md'));
  }

  return candidates.find((candidate) => fs.existsSync(candidate));
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
for (const section of [
  'core',
  'paths',
  'react',
  'solid',
  'vue',
  'react-native',
]) {
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
