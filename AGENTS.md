# AGENTS.md

This file provides guidance to AI coding agents (Claude Code and similar tools) when working with
code in this repository.

## Project overview

`effector/router` is a type-safe, framework-agnostic router built on [Effector](https://effector.dev).
It is a pnpm monorepo hosting the framework-agnostic core, a path-matching utility package, and
bindings for React, React Native, Vue 3, and SolidJS, plus the VitePress docs site published at
router.effector.dev.

## Commands

Run from the repo root unless noted. Requires Node 24 and pnpm 11 (pinned via `packageManager`;
`corepack enable` picks up the right version).

```bash
pnpm install              # install all workspace packages
pnpm build                # build every package in packages/*
pnpm test                 # run every package's test suite (vitest, --silent)
pnpm typecheck            # tsc -p tsconfig.check.json — whole-workspace type gate
pnpm lint                 # eslint
pnpm :docs typecheck      # typecheck docs/snippets (core, react, vue, solid, + negative fixture)
pnpm :docs check-links    # verify markdown/JSDoc links and sidebar entries
pnpm changeset            # record a changeset for a change (required for release-affecting PRs)
pnpm changeset --empty    # record a no-release changeset (tests/CI/internal refactors/docs-only)
```

CI runs `build → typecheck → lint → test` on every PR — run them locally in that order before
pushing.

`pnpm typecheck` resolves `@effector/router*` imports to package source (`lib/`) via
`tsconfig.check.json`, so it does **not** require a prior build.

**Working on a single package** — use the workspace shortcuts:

```bash
pnpm :core build          # :core :paths :react :react-native :vue :solid :solid-example :docs
pnpm :react test
pnpm :core exec vitest    # watch mode
```

**Running a single test** (vitest):

```bash
cd packages/core && pnpm exec vitest run tests/navigation.test.ts
pnpm :core exec vitest run tests/navigation.test.ts -t "some test name"
```

**Solid is special**: `packages/solid` has its own JSX/TS project (`packages/solid/tsconfig.json`)
and is excluded from the root `eslint.config.mts` and from `tsconfig.check.json`. Use
`pnpm :solid build` / `pnpm :solid test` as the authoritative gate for that package.

## Architecture

### Monorepo layout

- `packages/core` (`@effector/router`) — framework-agnostic router. Source lives in `lib/`, not `src/`.
- `packages/paths` (`@effector/router-paths`) — path template compiler used by core.
- `packages/react`, `packages/vue`, `packages/solid` — framework bindings with an intentionally
  mirrored file structure (see below).
- `packages/react-native` (`@effector/router-react-native`) — bindings on top of
  `@react-navigation`; the app owns the navigation ref.
- `docs/` — VitePress site, Diataxis-organized: `introduction/`, `quick-starts/`, `tutorials/`,
  `how-to/`, `explanation/`, `reference/`, `core/`. `docs/snippets/` holds typechecked example code
  (`pnpm :docs typecheck`); `docs/quick-starts/` fixtures are imported directly by package test
  suites, so documented setup and tested setup must stay identical (see CONTRIBUTING.md).
- `examples/solid-router` — standalone Solid example app.

### Core router model (`packages/core/lib`)

- **`create-route.ts`** — `createRoute()` builds a `Route` as a set of Effector units (`$params`,
  `$isOpened`, `$isPending`, `open`/`close` events, `opened`/`closed`/`updated`/`navigated` events).
  Its internal lifecycle runs on `createAttemptCoordinator` (`transition-attempt.ts`,
  `concurrency: 'takeLatest'`) and sequences: `beforeOpen` effects → recursive parent activation
  (`forceOpenParentFx`, walking `route.parent`) → activation. Path routes (`{ path }`) and
  pathless/virtual routes (no path — used for modals, `notFound`, `chainRoute` output) share this
  same lifecycle.
- **`create-router.ts`** — `createRouter({ routes, controls, notFound, base })` compiles each
  route's full path (walking the `parent` chain) via `@effector/router-paths`' `compile()`, matches
  the current `$path` against every route on each location update inside `matchRoutes()`, and
  derives `$activeRoutes` and per-route `navigated`/`close` calls from that **one shared match
  result** (`openRoutesByPathFx`). Nested routers (passed as entries in `routes`) delegate
  `setHistory` and are queried via `handlesPath` so a parent and nested `notFound` are never open at
  the same time. Don't add a second matching pass — activation, `$activeRoutes`, and dynamic
  `registerRoute` all read from this one.
- **`create-router-controls.ts` / `navigation.ts` / `adapters/`** — controls own `$path`, `$query`,
  `$history`, and the `navigate`/`back`/`forward` events. `adapters/history-adapter.ts` and
  `adapters/query-adapter.ts` connect controls to a `history` package instance or a query-only
  source. `adapters/history-block-coordinator.ts` shares one physical native-transition blocker
  across adapters built from the same `History` instance, so browser back/forward waits for every
  participating controls model.
- **`query-codec.ts`** — the single `Query` codec shared by controls and route navigation (`null`
  becomes a flag, arrays become repeated keys, `undefined` removes a key, key order is ignored for
  equality).
- **`chain-route.ts`**, **`group.ts`**, **`before-navigate.ts`**, **`redirect.ts`**,
  **`track-query.ts`** — composition helpers layered on routes/controls: post-commit readiness,
  route grouping, pre-commit navigation policy, redirect targets for `sample()`, and standalone
  query trackers.
- **`resolve-route-view.ts`** — `@internal`, exported anyway: the pure, framework-agnostic
  view-priority algorithm the `react`/`vue`/`solid` bindings' own `resolve-route-view` files wrap
  with their reactive glue (see below). Lives in core purely so the three bindings share one
  implementation instead of three hand-copied ones; not part of the router's documented public API.
- The accepted navigation lifecycle contract and its compatibility matrix are documented in
  `docs/explanation/navigation-lifecycle.md` — read it before changing router or route lifecycle
  behavior. It's enforced by `packages/core/tests/lifecycle-compatibility.test.ts` and
  `router.test.ts`.

### Framework bindings (`react`, `vue`, `solid`)

These three packages share an identical file set and are meant to track each other's API shape:
`context`, `router-provider`, `create-route-view`, `create-routes-view`, `create-lazy-route-view`,
`outlet`, `link`, `resolve-route-view`, `use-router`, `use-link`, `use-is-opened`,
`use-opened-views`, `with-layout`, `index`. When changing behavior in one, check whether the
equivalent change belongs in the other two.

`resolve-route-view` is internal and owns view selection for both `create-routes-view` and
`outlet`. The actual priority algorithm (opened view via `use-opened-views`, then `loading` of a
pending view, then holding the previously resolved view through the close/open gap, then `closed`
of a closed view — gated behind the `otherwise` prop until the list has genuinely been active —
then `null`) is `resolveRouteView` in `packages/core/lib/resolve-route-view.ts`, a pure,
framework-agnostic function exported (marked `@internal`) from `@effector/router` specifically for
the three bindings to share. Each binding's `resolve-route-view` file is thin reactive glue around
it: subscribing to opened/pending state, carrying the algorithm's state across calls, and
collapsing back to the previous object reference when a recompute doesn't change the selection.
React additionally defers committing that state to a `useLayoutEffect`, since a render pass can be
discarded without committing (Strict Mode's double-invoke, an interrupted concurrent render) and
must not leave behind a value nothing on screen ever matched. Fix the algorithm once in
`packages/core`; only the reactive wiring is binding-specific. `resolve-route-view` also wraps a
view's `closed`/`loading` with that view's `layout` at creation time, while `withLayout` groups are
applied by the renderers. The fallback symbol must stay absent from a `RouteView` that declares
neither, because `withLayout` copies own symbols onto its result.

### `packages/react-native`

A different pattern (not mirrored to the three above): `native-navigator.ts`,
`stack-navigator.tsx`, and `bottom-tabs-navigator.tsx` wrap `@react-navigation`, syncing router
state into the app-owned navigation ref via `navigation-bridge.ts`, `navigation-events.ts`, and
`navigation-sync.ts`.

### `packages/paths`

Pipeline: `tokenize-path.ts` → `convert-path.ts` → `compile.ts`, turning a path template string
into `{ build, parse }`. `validate-path.ts` is the compile-time (TS type-level) path validation used
in `createRoute`'s type signature; `validate-runtime-path.ts` is its runtime counterpart.
`param-names.ts` extracts declared parameter names (used by core to isolate each route's own params
from its parents').

## Testing conventions

- Vitest per package; `pnpm test` runs it recursively across `packages/*`.
- `packages/core/tests/docs-examples.test.ts` and `quick-start.test.ts` execute the documentation
  snippets/quick-starts directly — keep docs and tests in sync when either changes.
- `packages/core/tests/setup.ts` is the shared vitest setup file.

## Conventions

- **Changesets are required**: any PR affecting a published package needs `pnpm changeset` (or
  `pnpm changeset --empty` for no-release changes); the PR Checks workflow fails otherwise.
- **Commit style**: [Conventional Commits](https://www.conventionalcommits.org/) with a scope, e.g.
  `feat(react): add useIsOpened hook`, `fix(core): resolve query params on virtual routes`.
  Changelogs are generated from changesets, not commit messages.
- Avoid `@ts-expect-error` in production source (`packages/core/lib/create-route.ts` calls this out
  explicitly) — prefer one deliberate, well-commented type assertion at the public/internal
  boundary instead.
