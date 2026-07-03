# ☄️ effector/router

The most latest documentation published at [router.effector.dev](https://router.effector.dev)

A type-safe, framework-agnostic router built on top of [Effector](https://effector.dev). This repository is a
[pnpm](https://pnpm.io) monorepo that hosts the core router and its framework bindings.

## Packages

| Package                                                | Description                                          |
| ------------------------------------------------------ | ---------------------------------------------------- |
| [`@effector/router`](packages/core)                    | Framework-agnostic core router.                      |
| [`@effector/router-paths`](packages/paths)             | Path parsing and matching utilities.                 |
| [`@effector/router-react`](packages/react)             | React bindings for the router.                       |
| [`@effector/router-react-native`](packages/react-native) | React Native bindings for the router.              |

## Contributing

Contributions are welcome — bug reports, feature requests, documentation fixes, and pull requests.

Before opening a PR, please:

- Open (or find) an issue describing the problem or feature, so we can agree on the approach.
- Keep changes focused: one logical change per pull request.
- Add or update tests for any behavioural change.
- Add a changeset for anything that affects a published package (see [Release process](#release-process)).

### Local setup

Requirements:

- **Node.js 24** (matches CI).
- **pnpm 11** — this repo pins the version via the `packageManager` field, so
  [enable Corepack](https://nodejs.org/api/corepack.html) with `corepack enable` and pnpm will use the right version
  automatically.

```bash
# clone your fork
git clone https://github.com/<your-username>/router.git
cd router

# install dependencies for every workspace package
pnpm install
```

### Common commands

Run from the repository root:

| Command            | What it does                                             |
| ------------------ | -------------------------------------------------------- |
| `pnpm build`       | Build every package in `packages/*`.                     |
| `pnpm test`        | Run the test suites for every package.                   |
| `pnpm typecheck`   | Type-check the whole workspace with `tsc --noEmit`.      |
| `pnpm lint`        | Lint the codebase with ESLint.                           |
| `pnpm changeset`   | Create a changeset describing your change.               |

To work on a single package, use the workspace shortcuts, e.g. `pnpm :core build` or `pnpm :react test`
(shortcuts: `:core`, `:paths`, `:react`, `:react-native`, `:docs`).

### Running tests

```bash
# run all tests once
pnpm test

# run tests for a single package
pnpm :core test

# watch mode while developing a package (uses vitest)
pnpm :core exec vitest
```

Tests run on [Vitest](https://vitest.dev). CI runs `build → typecheck → lint → test` on every pull request.

### Documentation

The site under [router.effector.dev](https://router.effector.dev) is built from [`docs/`](docs) with
[VitePress](https://vitepress.dev):

```bash
pnpm :docs docs:dev    # local dev server
pnpm :docs docs:build  # production build
```

## Project structure

```
router/
├── packages/
│   ├── core/          # @effector/router — core router
│   ├── paths/         # @effector/router-paths — path utilities
│   ├── react/         # @effector/router-react — React bindings
│   └── react-native/  # @effector/router-react-native — React Native bindings
├── docs/              # VitePress documentation site
├── .changeset/        # pending changesets + config
└── .github/
    ├── actions/setup/ # composite action: pnpm + Node + install
    └── workflows/     # CI, release, and docs deployment
```

Every package is built with [Vite](https://vitejs.dev) and ships ESM (`dist/index.js`), CJS (`dist/index.cjs`), and
type declarations (`dist/index.d.ts`).

## Release process

Releases are automated with [Changesets](https://github.com/changesets/changesets) and published to npm via GitHub
Actions.

1. **Add a changeset with your PR.** Run `pnpm changeset`, pick the affected packages and the bump level
   (`patch` / `minor` / `major`), and describe the change. Commit the generated file in `.changeset/`.
   - The `PR Checks` workflow fails if a release-affecting PR has no changeset.
   - For intentional no-release changes (tests, CI, docs), add an empty changeset: `pnpm changeset --empty`.
2. **Merge to `main`.** The `Release` workflow builds, type-checks, and tests the packages, then opens (or updates)
   a **"Version Packages"** pull request that consumes the pending changesets, bumps versions, and updates changelogs.
3. **Merge the "Version Packages" PR.** The same workflow then publishes the updated packages to npm (public access,
   via OIDC trusted publishing — no npm token required), pushes git tags, and creates GitHub Releases.

Documentation is deployed separately: pushes to `main` that touch `docs/**` or `packages/core/package.json` trigger
the `Deploy docs` workflow, which publishes to GitHub Pages.

## License

[MIT](LICENSE)
