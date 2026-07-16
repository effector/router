// Guards F1: the root typecheck must succeed on a clean tree, without a prior
// `pnpm build`. Root `tsconfig.json` resolves `@effector/router*` from package
// sources (compilerOptions.paths), so `tsc --noEmit` no longer depends on built
// `dist/*.d.ts`. This script removes every package `dist` and runs the gate.
//
// Usage: node scripts/check-typecheck-standalone.mjs
import { rmSync } from 'node:fs';
import { globSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

for (const dist of globSync('packages/*/dist', { cwd: root })) {
  rmSync(resolve(root, dist), { recursive: true, force: true });
}

const result = spawnSync('pnpm', ['typecheck'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  console.error(
    '\n[check-typecheck-standalone] `pnpm typecheck` failed without a prior build.\n' +
      'The root tsconfig must resolve workspace packages from source so the type\n' +
      'gate is independent of build order. See tsconfig.json compilerOptions.paths.',
  );
  process.exit(result.status ?? 1);
}

console.log('\n[check-typecheck-standalone] OK: typecheck passes on a clean tree.');
