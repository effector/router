# Contributing to effector/router

Thanks for taking the time to contribute! 🎉

This project is a [pnpm](https://pnpm.io) monorepo that hosts the framework-agnostic
[`@effector/router`](packages/core) core and its bindings for React and React Native. Contributions of
all kinds are welcome — bug reports, feature requests, documentation fixes, and pull requests.

This document explains how to get set up, what we expect from a contribution, and how the project is
released. For a high-level overview of the packages and repository layout, see the [README](README.md).

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Reporting bugs and requesting features](#reporting-bugs-and-requesting-features)
- [Asking questions](#asking-questions)
- [Development setup](#development-setup)
- [Project structure](#project-structure)
- [Common commands](#common-commands)
- [Working on a change](#working-on-a-change)
- [Changesets](#changesets)
- [Commit messages](#commit-messages)
- [Opening a pull request](#opening-a-pull-request)
- [Release process](#release-process)
- [License](#license)

## Code of conduct

Please be respectful and constructive in all interactions. We aim to keep this a welcoming community for
everyone. Harassment, personal attacks, or dismissive behaviour are not tolerated. If you experience or
witness unacceptable behaviour, contact a maintainer.

## Ways to contribute

- **Report a bug** or **request a feature** by opening an issue.
- **Improve the documentation** under [`docs/`](docs) or the package READMEs.
- **Submit a pull request** that fixes a bug or implements an agreed-upon feature.
- **Help others** in the [Effector community](https://effector.dev/en/community/).

> [!TIP]
> Before starting non-trivial work, open (or find) an issue describing the problem or feature so we can
> agree on the approach. This saves you from investing time in a change that may not be merged.

## Reporting bugs and requesting features

Issues are managed through templates. When you [open an issue](https://github.com/effector/router/issues/new/choose),
pick the one that fits:

- **🐛 Bug report** — something isn't working as documented or expected.
- **✨ Feature request** — a new capability or improvement.
- **📝 Documentation** — something is missing, wrong, or unclear in the docs.

A good bug report includes:

- The affected package and version (e.g. `@effector/router@x.y.z`).
- A **minimal reproduction** — ideally a runnable snippet or repository.
- What you expected to happen and what actually happened.
- Your environment (Node.js version, framework versions, browser if relevant).

The more precisely you can reproduce the problem, the faster it can be fixed.

## Asking questions

The issue tracker is for bugs and feature work. For usage questions, please:

- Read the docs at [router.effector.dev](https://router.effector.dev) first.
- Ask in the [Effector community](https://effector.dev/en/community/).

## Development setup

**Requirements:**

- **Node.js 24** (this is what CI uses).
- **pnpm 11** — the version is pinned via the `packageManager` field, so
  [enable Corepack](https://nodejs.org/api/corepack.html) with `corepack enable` and the correct pnpm
  version is used automatically.

**Fork and clone:**

```bash
# clone your fork
git clone https://github.com/<your-username>/router.git
cd router

# install dependencies for every workspace package
pnpm install
```

## Project structure

```
router/
├── packages/
│   ├── core/          # @effector/router — framework-agnostic core router
│   ├── paths/         # @effector/router-paths — path parsing & matching
│   ├── react/         # @effector/router-react — React bindings
│   └── react-native/  # @effector/router-react-native — React Native bindings
├── docs/              # VitePress documentation site
├── .changeset/        # pending changesets + config
└── .github/           # CI, release & docs workflows, issue/PR templates
```

## Common commands

Run these from the repository root:

| Command          | What it does                                        |
| ---------------- | --------------------------------------------------- |
| `pnpm build`     | Build every package in `packages/*`.                |
| `pnpm test`      | Run the test suites for every package.              |
| `pnpm typecheck` | Type-check the whole workspace with `tsc --noEmit`. |
| `pnpm lint`      | Lint the codebase with ESLint.                      |
| `pnpm changeset` | Create a changeset describing your change.          |

To work on a single package, use the workspace shortcuts (`:core`, `:paths`, `:react`, `:react-native`,
`:docs`), for example:

```bash
pnpm :core build         # build only the core package
pnpm :react test         # test only the React bindings
pnpm :core exec vitest   # watch mode while developing a package
```

Tests run on [Vitest](https://vitest.dev). Working on the docs site:

```bash
pnpm :docs docs:dev      # local dev server for router.effector.dev
pnpm :docs docs:build    # production build of the docs
```

## Working on a change

1. **Create a branch** off `main` in your fork.
2. **Keep it focused** — one logical change per pull request. Unrelated fixes belong in separate PRs.
3. **Add or update tests** for any behavioural change. New behaviour without tests will usually be asked
   to add them.
4. **Update the docs** under [`docs/`](docs) when you change public behaviour or APIs.
5. **Add a changeset** for anything that affects a published package (see [Changesets](#changesets)).
6. **Run the full check suite locally** before pushing:

   ```bash
   pnpm build
   pnpm typecheck
   pnpm lint
   pnpm test
   ```

   CI runs `build → typecheck → lint → test` on every pull request — running them locally first avoids
   round-trips.

## Changesets

Releases are driven by [Changesets](https://github.com/changesets/changesets). Every PR that affects a
published package must include one:

```bash
pnpm changeset
```

Pick the affected packages and the bump level (`patch` / `minor` / `major`), describe the change in a
user-facing way, and commit the generated file in `.changeset/`.

For intentional no-release changes (tests, CI, internal refactors, docs), add an empty changeset:

```bash
pnpm changeset --empty
```

> [!IMPORTANT]
> The **PR Checks** workflow fails if a release-affecting PR has no changeset. The auto-generated
> "Version Packages" PR is exempt.

Guidance on choosing a bump level:

- **patch** — bug fixes and internal changes with no API impact.
- **minor** — new, backwards-compatible features.
- **major** — breaking changes to public APIs.

## Commit messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/). Use a type prefix so
history stays readable:

```
feat(react): add useIsOpened hook
fix(core): resolve query params on virtual routes
docs: clarify createRoute usage
chore(deps): bump vitest
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`. Note that changelogs are
generated from changesets, not from commit messages — but clean commits still help reviewers.

## Opening a pull request

1. Push your branch and open a PR against `main`.
2. Fill in the [pull request template](.github/PULL_REQUEST_TEMPLATE.md), including the summary, type of
   change, and the checklist.
3. Link the related issue (`Closes #123`) or explain why there isn't one.
4. Make sure all CI checks are green.

Before requesting review, confirm:

- [ ] The change is focused and scoped to one thing.
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm lint`, and `pnpm test` pass.
- [ ] Tests were added or updated for behavioural changes.
- [ ] Docs were updated if public behaviour changed.
- [ ] A changeset was added (`pnpm changeset`), or an empty one for no-release changes.

Maintainers may request changes — this is a normal part of the process and helps keep the project
consistent. Once approved, a maintainer will merge your PR.

## Release process

Releases are automated with Changesets and published to npm via GitHub Actions:

1. **Add a changeset with your PR** (see above).
2. **Merge to `main`.** The `Release` workflow builds, type-checks, and tests the packages, then opens
   (or updates) a **"Version Packages"** pull request that consumes the pending changesets, bumps
   versions, and updates changelogs.
3. **Merge the "Version Packages" PR.** The same workflow then publishes the updated packages to npm
   (public access, via OIDC trusted publishing — no npm token required), pushes git tags, and creates
   GitHub Releases.

Documentation deploys separately: pushes to `main` that touch `docs/**` or `packages/core/package.json`
trigger the `Deploy docs` workflow, which publishes to GitHub Pages.

You don't need to run any release steps yourself — just include a changeset with your change.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
