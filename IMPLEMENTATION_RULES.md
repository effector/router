# Implementation rules

Rules for executing the ordered backlog in [TASKS.md](TASKS.md).

## Sources of truth

When documents disagree, use this order:

1. [DECISIONS.md](DECISIONS.md) defines accepted public contracts.
2. [docs/core/navigation-lifecycle.md](docs/core/navigation-lifecycle.md) defines accepted
   lifecycle invariants that adjacent work must preserve.
3. [TASKS.md](TASKS.md) defines the order and complete scope of remaining work.
4. [BUGS.md](BUGS.md) records concrete regressions. Insert a regression into
   the nearest applicable TASKS stage before adding new behavior in that area.

If implementation requires a public contract that Decisions does not define,
stop at a minimal contract proposal. Do not silently introduce new `task`,
`guard`, `barrier`, `blocker`, `transition`, or similar entities when existing
routes, controls, and Effector units can express the behavior.

## Starting a task

- Take exactly one `Txx` per implementation slice unless the user explicitly
  combines adjacent tasks.
- Before editing, read the linked Decisions section, the selected task, earlier
  tasks in its stage, and the source/test directories listed below.
- Start with a short task brief: observable behavior, affected public types,
  expected files, regression tests, and changesets. A task brief cannot alter
  an accepted contract.
- Do not opportunistically implement later `Txx` items. If a missing dependency
  is discovered, update or reorder TASKS in a separate documentation commit
  before changing runtime code.
- A task marked `Contract checkpoint` does not authorize choosing a public API.
  Its output is an exact Decisions and TASKS amendment. Runtime work starts only
  after that amendment is accepted.
- A task with `matrix`, `checkpoint`, `suite`, `slice`, or `gate` in its name is
  a verification task. It is not an invitation to redesign an implemented
  contract.

## Implementation slice

One `Txx` is a complete vertical slice, not only a runtime change. Execute it in
this order:

1. Compare the task against current runtime, types, tests, documentation, and
   public exports. Do not rewrite already covered behavior without a reason.
2. First add a regression test or compile-time assertion that demonstrates the
   missing contract.
3. Make the smallest change on top of existing Effector units and operators. A
   private shared helper is allowed when it removes real duplication. A public
   primitive requires a separate accepted decision.
4. Verify runtime and types together. A public conditional API needs positive
   fixtures and expected-error type fixtures.
5. Cover applicable boundaries: repetition, cancellation/error, same-value
   updates, cleanup, Fork API scope/global scope, SSR/client behavior, and
   native/browser behavior.
6. In the same slice, update public exports, the package README, relevant docs
   pages, and examples. Documentation describes only behavior proven by tests.
7. Add a changeset for every affected published package. Use an empty changeset
   for docs/test/CI-only work when the PR check requires one.
8. Run package-level build/typecheck/tests, then relevant dependent packages.
   Run the full repository gate before completing a stage.
9. Create a focused commit after checks pass. Do not combine independent stages
   in one commit.

## Repository routing

| Tasks   | Primary source                                                 | Tests and documentation                                          | Minimum verification                                                                         |
| ------- | -------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| T01–T05 | `packages/paths/lib`                                           | `packages/paths/tests`, `packages/paths/README.md`, `docs/paths` | `pnpm :paths build`, `pnpm :paths test`, `pnpm typecheck`                                    |
| T06–T32 | `packages/core/lib`                                            | `packages/core/tests`, `packages/core/README.md`, `docs/core`    | `pnpm :paths build`, `pnpm :core build`, `pnpm :core test`, `pnpm typecheck`                 |
| T33–T44 | `packages/react/lib`, `packages/solid/lib`, `packages/vue/lib` | Tests and docs for the affected bindings                         | Build/test each affected binding, `pnpm typecheck`                                           |
| T45–T51 | `packages/react-native/lib`                                    | `packages/react-native/tests`, README, `docs/react-native`       | `pnpm :react build`, `pnpm :react-native build`, `pnpm :react-native test`, `pnpm typecheck` |
| T52–T56 | Root scripts, `.github`, `docs`                                | Docs fixtures and conformance tests                              | Full repository gate                                                                         |

When a task changes an upstream public type, also verify every package that
imports that type, even if those packages belong to a later stage.

Full repository gate:

```sh
pnpm build
pnpm typecheck
pnpm test
pnpm lint
pnpm :docs docs:build
pnpm changeset status --since=origin/main
```

## Dependencies and ordering

- Execute TASKS stages and tasks from top to bottom. Reordering is allowed only
  when it preserves documented dependencies and is recorded in TASKS before
  implementation starts.
- Do not begin a binding migration until its core payloads and query semantics
  are stable.
- Update React, Solid, and Vue together when they share a RouteView or Link
  contract. Keep framework-specific details inside each binding.
- Preserve runtime and type compatibility for deprecated APIs until the stated
  major release. Deprecation does not permit a hidden breaking change.
- Do not edit generated `dist` manually. Verify it through the package build.
- Do not use `@ts-expect-error` to bypass an error in production source. It is
  allowed only in a negative type test that explains the expected error.

## Completion criteria

Mark a task `[x]` in TASKS only when all of these are complete:

- runtime contract;
- public type contract;
- regression and type tests;
- docs, README, and public exports;
- changesets for all affected packages;
- relevant checks are green.

If only part of a task is complete, keep it unchecked and narrow its wording to
the actual remainder. Keep accepted decisions in DECISIONS as an audit trail.
