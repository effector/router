# Quick-start fixtures

These fixtures are the executable source for the five published quick-start
shapes:

- `core.ts`
- `react.tsx`
- `solid.tsx`
- `vue.ts`
- `react-native.tsx`

The package smoke tests import them directly. Renderer fixtures open an initial
route and perform one navigation; the React Native fixture is rendered by the
mocked native integration harness in `packages/react-native/tests/integration.test.tsx`.
Run `pnpm docs:typecheck` for the type contract and the package test commands
for runtime smoke coverage.
