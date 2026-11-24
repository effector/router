// @vitest-environment node
import { resolve } from 'node:path';
import { build, type Plugin } from 'vite';
import { expect, test } from 'vitest';

// Bundles one entry into one ES file, the way an application bundler does.
async function bundle(entry: string, plugins: Plugin[] = []) {
  const result = await build({
    configFile: false,
    logLevel: 'silent',
    plugins,
    build: {
      write: false,
      minify: false,
      lib: { entry: resolve(__dirname, entry), formats: ['es'] },
      rollupOptions: {
        external: [
          'effector',
          'effector-vue/composition',
          '@effector/router',
          'vue',
        ],
        // Drops the bare imports of the external packages as well.
        treeshake: { moduleSideEffects: 'no-external' },
      },
    },
  });
  const [{ output }] = result as Extract<typeof result, unknown[]>;

  expect(output).toHaveLength(1);

  return output[0].type === 'chunk' ? output[0].code : '';
}

// Rollup keeps a top-level call unless it is marked as pure. This bundles an
// entry that imports the package and uses nothing, the way an application
// bundler sees an unused import.
test('an unused import of the package leaves no code in the bundle', async () => {
  const code = await bundle('fixtures/unused-import.ts');

  expect(code.trim()).toBe('');
});

// `"sideEffects": false` lets a bundler drop a whole file and nothing less.
// The published build is one file, so there only `@__PURE__` removes a
// component the application does not use. The package is built into one file
// first, and the entry gets that file in place of `lib`.
test('a partial import of the one-file build leaves no component in the bundle', async () => {
  const oneFile = await bundle('../lib/index.ts');
  const code = await bundle('fixtures/partial-import.ts', [
    {
      name: 'one-file-build',
      enforce: 'pre',
      resolveId: (source) => (source === '../../lib' ? '\0one-file' : null),
      load: (id) => (id === '\0one-file' ? oneFile : null),
    },
  ]);

  expect(oneFile).toContain('defineComponent');
  expect(code).toContain('useRouterContext');
  expect(code).not.toContain('defineComponent');
});
