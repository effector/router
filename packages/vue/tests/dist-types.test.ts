// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

// The declarations the package publishes. `pnpm :vue build` writes the file,
// and CI builds before it runs the tests. tree-shaking.test.ts bundles `lib`
// itself; the declarations come only from the build, so this file reads it.
const file = resolve(__dirname, '../dist/index.d.ts');

function readDeclarations() {
  expect(existsSync(file), 'run `pnpm :vue build` first').toBe(true);

  return readFileSync(file, 'utf8');
}

// A type name of `effector-vue` in the declarations ties the published types
// to the versions of `effector-vue` that export it: `UseUnitResult` exists
// only since 23.3.0. The public types are written by hand for that reason.
test('the built declarations import nothing from effector-vue', () => {
  const imports = [
    ...readDeclarations().matchAll(/(?:from|import\()\s*['"]([^'"]+)['"]/g),
  ].map((match) => match[1]);

  // The pattern finds the imports of the file.
  expect(imports).toContain('vue');
  expect(imports).toContain('@effector/router');
  expect(imports.filter((name) => name.startsWith('effector-vue'))).toEqual([]);
});

// The bundler of the declarations must keep the hand-written constructor:
// without its type parameter `Link` checks no `params`.
test('the built declarations keep the generic constructor of Link', () => {
  const declarations = readDeclarations();

  expect(declarations).toContain('export declare const Link: LinkComponent;');
  expect(declarations).toMatch(
    /new <R extends Route<any>>\(props: LinkPropsOf<R> & PublicProps\)/,
  );
});
