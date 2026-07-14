# Paths documentation tasks

Audit scope: `packages/paths/README.md`, `docs/paths/index.md`, every file in `packages/paths/lib/`, and both paths test files. The paths suite passes (46 tests). Runtime spot checks were also used for documented edge cases that currently have no tests.

## Актуализация документации

- [ ] Align optional-parameter types and examples. The docs show `ParseUrlParams<'/user/:id?'>` as `{ id?: string }` and call `build({})`, but the type implementation produces a required property `{ id: string | undefined }`. Either make the property genuinely optional or update all examples and builder calls to pass `{ id: undefined }`; add compile-time tests for omission.

- [ ] Align optional parse results. `docs/paths/index.md` says `parse('/user')` returns `params: {}`, while the parser and tests return `params: { id: undefined }`. Choose one stable public shape and update docs, types, and tests together.

- [ ] Make builder cardinality behavior match the modifier documentation. The guide says `+` requires one or more values and range builds outside `{min,max}` throw, but `prepareBuilder` performs no cardinality validation: an empty `+` array and a one-item `{2,3}` array both build successfully. Either validate and throw or explicitly document that constraints are parse-only; cover `+`, `*`, exact ranges, and min/max ranges in build tests.

### GitHub issues

- [ ] #38 Docs: validating/parsing optional params

## Модификация поведения

- [ ] Preserve valid falsy parameter values in `build`. `prepareBuilder` skips every falsy value via `if (!params[token.name])`, so the documented numeric API builds `{ id: 0 }` as `/post` instead of `/post/0`; required empty-string values are silently omitted as well. Check specifically for `null`/`undefined` and add regression tests.

- [ ] Fix optional range parsing or remove the documented combination. The README and guide advertise patterns such as `:ids<number>{1,3}?` as optional and show `build({})`, but `prepareParser` still enforces the range minimum when the segment is absent, so `parse('/items')` returns `null`. Add absent/present parse tests for range plus `?`, `*`, and `+`.

- [ ] Make `convertPath` work with arbitrary parameter names. The docs demonstrate `:path+`, `:version?`, and `*path?`, but every conversion regex is hard-coded to the literal name `id`; those examples are returned unchanged. Generalize conversion to capture names and add the documented examples to `convert.test.ts`.

- [ ] Define the supported generic syntax consistently. Type-level `GenericType<'string'>` becomes the string literal type `'string'`, while the runtime compiler treats every generic other than `number` or a union as an unconstrained string. `ValidateTypes` also effectively accepts any string. Either support/document named generic types (including `string`) consistently or reject unsupported generics at type and runtime levels.

### GitHub issues

- [ ] #67 Support full-URL path patterns (micro-frontends) in @effector/router-paths

## Контроль качества

- [ ] Add documentation conformance tests for the quick-start matrix. Current tests cover many parse cases but miss several claims that proved inconsistent: zero-valued builds, empty `+` builds, invalid range builds, absent optional ranges, arbitrary-name Express conversion, and the exact documented optional result shape. Prefer table-driven runtime tests plus compile-time assertions for inferred types.
