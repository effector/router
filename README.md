# ☄️ effector/router

The latest documentation is published at [router.effector.dev](https://router.effector.dev).

A type-safe, framework-agnostic router built on top of [Effector](https://effector.dev). This repository is a
[pnpm](https://pnpm.io) monorepo that hosts the core router and its framework bindings.

## Packages

| Package                                                  | Description                              |
| -------------------------------------------------------- | ---------------------------------------- |
| [`@effector/router`](packages/core)                      | Framework-agnostic core router.          |
| [`@effector/router-paths`](packages/paths)               | Path parsing and matching utilities.     |
| [`@effector/router-react`](packages/react)               | React bindings for the router.           |
| [`@effector/router-react-native`](packages/react-native) | React Native bindings for the router.    |
| [`@effector/router-solid`](packages/solid)               | SolidJS bindings for the router (draft). |
| [`@effector/router-vue`](packages/vue)                   | Vue 3 bindings for the router (beta).    |

## Documentation

Full documentation is published at [router.effector.dev](https://router.effector.dev). Each package also
has its own README: [core](packages/core), [paths](packages/paths), [react](packages/react),
[react-native](packages/react-native), [solid](packages/solid), and [vue](packages/vue).

The composable navigation lifecycle and its design rationale are recorded in the
[navigation lifecycle RFC](NAVIGATION_LIFECYCLE_RFC.md).

## Contributing

Contributions are welcome — bug reports, feature requests, documentation fixes, and pull requests. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the development setup, commands, changeset and release workflow,
and how to open a pull request.

## License

[MIT](LICENSE)
